/**
 * prepare.ts — Render TTS audio from the slide script (single source of truth).
 *
 * Imports slides from src/data/script.ts, sends narrations to DeepInfra
 * Chatterbox with Adam's cloned voice, writes MP3s + manifest.json.
 *
 * Usage:
 *   npx tsx prepare.ts          # render missing slides (resume support)
 *   npx tsx prepare.ts --force  # re-render all slides
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { parseBuffer } from "music-metadata";
import { SCRIPT } from "./src/data/script";

// ── Config ────────────────────────────────────────────────────────

const VOICE_ID = "1f7zwaddjtlht0nw02oa"; // Adam's cloned voice
const MODEL = "ResembleAI/chatterbox-turbo";
const API_URL = "https://api.deepinfra.com/v1/openai/audio/speech";
const CONCURRENCY = 10;
const TIMEOUT_MS = 90_000;
const MAX_RETRIES = 3;

const AUDIO_DIR = join(dirname(import.meta.url.replace("file://", "")), "public", "audio");
const MANIFEST_PATHS = [
  join(AUDIO_DIR, "manifest.json"),
  join(dirname(import.meta.url.replace("file://", "")), "src", "data", "manifest.json"),
];
const CACHE_PATH = join(AUDIO_DIR, ".narration-hashes.json");

type CacheHashes = Record<string, string>;

function hashNarration(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function loadCache(): CacheHashes {
  if (existsSync(CACHE_PATH)) {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  }
  return {};
}

function saveCache(cache: CacheHashes): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

function getToken(): string {
  const tokenPath = join(process.env.HOME || "~", ".tokens", "deepinfra");
  return readFileSync(tokenPath, "utf-8").trim();
}

// ── TTS text normalization ────────────────────────────────────────

function normalizeForTTS(text: string): string {
  let t = text;

  // Specific terms
  const replacements: [string, string][] = [
    ["OWUI", "O W U I"],
    ["HTTPS", "H T T P S"],
    ["HTTP", "H T T P"],
    ["API", "A P I"],
    ["SSH", "S S H"],
    ["VM", "V M"],
    ["IDE", "I D E"],
    ["URL", "U R L"],
    ["CLI", "C L I"],
    ["CSV", "C S V"],
    ["CSS", "C S S"],
    ["TLS", "T L S"],
    ["TTS", "T T S"],
    ["CI", "C I"],
    ["KB", "kilobytes"],
    ["AGENTS.md", "agents dot M D"],
    ["httpx", "H T T P X"],
  ];

  for (const [from, to] of replacements) {
    t = t.replaceAll(from, to);
  }

  // Product names
  t = t.replaceAll("Daytona", "Day tona");

  // Em dashes to commas for natural pauses
  t = t.replaceAll(" — ", ", ");
  t = t.replaceAll("—", ", ");

  return t;
}

// ── TTS rendering ─────────────────────────────────────────────────

type SlideEntry = { id: string; narration: string };
type ManifestEntry = { file: string; durationMs: number };

async function renderSlide(
  token: string,
  slide: SlideEntry,
  force: boolean,
  cache: CacheHashes,
): Promise<ManifestEntry> {
  const filename = `${slide.id}.mp3`;
  const filepath = join(AUDIO_DIR, filename);
  const hash = hashNarration(slide.narration);

  // Skip if MP3 exists and narration hasn't changed
  if (!force && existsSync(filepath) && cache[slide.id] === hash) {
    const buf = readFileSync(filepath);
    const meta = await parseBuffer(buf, { mimeType: "audio/mpeg" });
    const durationMs = Math.round((meta.format.duration ?? 0) * 1000);
    console.log(`  [skip] ${slide.id} (${durationMs}ms)`);
    return { file: filename, durationMs };
  }

  if (!force && existsSync(filepath) && cache[slide.id] !== hash) {
    console.log(`  [stale] ${slide.id} — narration changed, re-rendering`);
  }

  const normalized = normalizeForTTS(slide.narration);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          input: normalized,
          voice: VOICE_ID,
          response_format: "mp3",
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      }

      const buf = Buffer.from(await resp.arrayBuffer());
      writeFileSync(filepath, buf);

      const meta = await parseBuffer(buf, { mimeType: "audio/mpeg" });
      const durationMs = Math.round((meta.format.duration ?? 0) * 1000);
      console.log(`  [done] ${slide.id} (${durationMs}ms)`);
      return { file: filename, durationMs };
    } catch (err) {
      const wait = 2 ** (attempt + 1);
      console.log(`  [retry ${attempt + 1}/${MAX_RETRIES}] ${slide.id}: ${err}, waiting ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
  }

  throw new Error(`Failed to render ${slide.id} after ${MAX_RETRIES} retries`);
}

// ── Concurrency limiter ───────────────────────────────────────────

async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const idx = next++;
      results[idx] = await tasks[idx]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const force = process.argv.includes("--force");
  const token = getToken();

  mkdirSync(AUDIO_DIR, { recursive: true });

  // Extract all slides from the SSOT
  const slides: SlideEntry[] = SCRIPT.flatMap((part) =>
    part.slides.map((s) => ({ id: s.id, narration: s.narration })),
  );

  const cache = loadCache();

  console.log(`Rendering ${slides.length} slides with ${CONCURRENCY}x concurrency`);
  console.log(`Voice: ${VOICE_ID}, Model: ${MODEL}`);
  if (force) console.log("Force mode: re-rendering all slides");
  console.log();

  const tasks = slides.map((slide) => () => renderSlide(token, slide, force, cache));
  const results = await withConcurrency(tasks, CONCURRENCY);

  // Build manifest
  const manifest: Record<string, ManifestEntry> = {};
  const newCache: CacheHashes = {};
  let totalMs = 0;
  for (let i = 0; i < slides.length; i++) {
    manifest[slides[i].id] = results[i];
    newCache[slides[i].id] = hashNarration(slides[i].narration);
    totalMs += results[i].durationMs;
  }

  const json = JSON.stringify(manifest, null, 2) + "\n";
  for (const p of MANIFEST_PATHS) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, json);
  }
  saveCache(newCache);

  console.log(`\nDone. ${slides.length} slides, ${(totalMs / 1000).toFixed(1)}s total narration`);
  console.log(`Manifest written to: ${MANIFEST_PATHS.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
