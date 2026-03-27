# /// script
# requires-python = ">=3.11"
# dependencies = ["openai", "mutagen", "httpx"]
# ///

"""
Render TTS audio for all slides using DeepInfra Chatterbox with Adam's cloned voice.
Writes MP3s to public/audio/ and a manifest.json mapping slide IDs to files + durations.

Usage:
    uv run --script render-tts.py          # render all slides
    uv run --script render-tts.py --force  # re-render even if MP3 exists
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path

import httpx
from mutagen.mp3 import MP3

# ── Config ─────────────────────────────────────────────────────────

VOICE_ID = "1f7zwaddjtlht0nw02oa"  # Adam's cloned voice
MODEL = "ResembleAI/chatterbox-turbo"
API_URL = "https://api.deepinfra.com/v1/openai/audio/speech"
TOKEN_PATH = Path.home() / ".tokens" / "deepinfra"
AUDIO_DIR = Path(__file__).parent / "public" / "audio"
MANIFEST_PATH = AUDIO_DIR / "manifest.json"
CONCURRENCY = 10
TIMEOUT = 90
MAX_RETRIES = 3

# ── Narration data — revised narrative: spin up, work, spin down ──

SLIDES = [
    # Act 1: Spin Up
    ("title", "Lathe is an agent harness for Open WebUI. Inspired by coding agents like Pi and OpenCode — but built for the browser."),
    ("the-landscape", "Terminal coding agents are everywhere now. They're fast, capable, and deeply integrated with developer workflows. But they assume you're at a workstation with a shell. Lathe brings that same agent surface to Open WebUI — any model, any browser, no local setup."),
    ("first-message", "A user opens their browser and starts a conversation. Nothing special yet — just a chat window. But the moment the model reaches for a tool, something happens."),
    ("sandbox-spins-up", "A sandbox spins up. A full Linux VM, provisioned on demand, dedicated to this user. The model didn't ask for it. The user didn't configure it. Lathe handled the lifecycle transparently — create, start, wait for ready."),
    ("arch-overview", "The architecture is simple. The user talks to a model in Open WebUI. The model calls Lathe's tools. Each tool executes in a Daytona sandbox. Results flow back as tool output the model reasons about."),

    # Act 2: Get to Work
    ("clones-repo", "The agent clones the repo and explores the project structure. Shell commands, file reads, edits — the full surface of a coding agent, running in the sandbox."),
    ("onboards", "Then it calls onboard. This loads project-specific instructions, conventions, and context — all in one shot. The agent picks up the project's norms the same way a new teammate would read the contributing guide."),
    ("builds-something", "The agent gets to work. It writes code, installs dependencies, starts a dev server. Each step is a tool call — visible in the conversation as it happens. Packages stay installed across conversations because the sandbox is persistent."),
    ("expose-moment", "Now here's where it gets interesting. The agent calls expose — and the user gets a public URL to whatever's running in the sandbox. A web app. A file browser. A full VS Code instance. The interaction breaks out of the chat window."),
    ("beyond-chat", "The user opens VS Code in one tab and the running app in another. They edit code directly while the agent makes structural changes through chat. Both work on the same filesystem, in the same sandbox, at the same time."),

    # Act 3: Spin Down
    ("session-ends", "When the user is done, they just close the tab. The sandbox idles for a few minutes, then sleeps on its own. No teardown. No save button."),
    ("any-device", "And because the sandbox is in the cloud, it's not tied to a machine — it's tied to you. Start a conversation on your laptop at the office, then pick it up on your phone on the bus. Anywhere you can reach your Open WebUI server, your sandbox is there."),
    ("comes-back", "Days later, the user starts a new conversation. The sandbox wakes transparently on the first tool call. Files, packages, git history — all still there. The agent calls onboard and picks up the project context immediately."),
    ("the-cycle", "That's the cycle. Spin up, get to work, spin down. The sandbox is infrastructure that appears when you need it and disappears when you don't. One toolkit. One API key. Every model on the server gets a coding agent surface."),
    ("outro", "Lathe. An agent harness for Open WebUI."),
]


# ── TTS text normalization ─────────────────────────────────────────

def normalize_for_tts(text: str) -> str:
    """Pre-process text to avoid Chatterbox pronunciation issues."""
    t = text

    # Specific terms first
    t = t.replace("OWUI", "O W U I")
    t = t.replace("HTTPS", "H T T P S")
    t = t.replace("HTTP", "H T T P")
    t = t.replace("API", "A P I")
    t = t.replace("SSH", "S S H")
    t = t.replace("VM", "V M")
    t = t.replace("IDE", "I D E")
    t = t.replace("URL", "U R L")
    t = t.replace("CLI", "C L I")
    t = t.replace("CSV", "C S V")
    t = t.replace("CSS", "C S S")
    t = t.replace("TLS", "T L S")
    t = t.replace("KB", "kilobytes")
    t = t.replace("TTS", "T T S")
    t = t.replace("CI", "C I")

    # Product names — pronounce as words
    t = t.replace("Daytona", "Day tona")

    # Domain names and code references
    t = t.replace("httpx", "H T T P X")
    t = t.replace("AGENTS.md", "agents dot M D")

    # Em dashes to commas for more natural pauses
    t = t.replace(" — ", ", ")
    t = t.replace("—", ", ")

    return t


# ── TTS rendering ──────────────────────────────────────────────────

async def render_slide(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    token: str,
    slide_id: str,
    narration: str,
    force: bool = False,
) -> tuple[str, str, int]:
    """Render one slide's narration to MP3. Returns (slide_id, filename, duration_ms)."""
    filename = f"{slide_id}.mp3"
    filepath = AUDIO_DIR / filename

    # Skip if already rendered (resume support)
    if filepath.exists() and not force:
        mp3 = MP3(str(filepath))
        duration_ms = int(mp3.info.length * 1000)
        print(f"  [skip] {slide_id} ({duration_ms}ms)")
        return slide_id, filename, duration_ms

    normalized = normalize_for_tts(narration)

    async with semaphore:
        for attempt in range(MAX_RETRIES):
            try:
                resp = await client.post(
                    API_URL,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": MODEL,
                        "input": normalized,
                        "voice": VOICE_ID,
                        "response_format": "mp3",
                    },
                    timeout=TIMEOUT,
                )
                resp.raise_for_status()
                filepath.write_bytes(resp.content)

                mp3 = MP3(str(filepath))
                duration_ms = int(mp3.info.length * 1000)
                print(f"  [done] {slide_id} ({duration_ms}ms)")
                return slide_id, filename, duration_ms

            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                wait = 2 ** (attempt + 1)
                print(f"  [retry {attempt+1}/{MAX_RETRIES}] {slide_id}: {e}, waiting {wait}s")
                await asyncio.sleep(wait)

        raise RuntimeError(f"Failed to render {slide_id} after {MAX_RETRIES} retries")


async def main():
    force = "--force" in sys.argv

    token = TOKEN_PATH.read_text().strip()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Rendering {len(SLIDES)} slides with {CONCURRENCY}x concurrency")
    print(f"Voice: {VOICE_ID}, Model: {MODEL}")
    if force:
        print("Force mode: re-rendering all slides")
    print()

    semaphore = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient() as client:
        tasks = [
            render_slide(client, semaphore, token, sid, narration, force)
            for sid, narration in SLIDES
        ]
        results = await asyncio.gather(*tasks)

    # Build manifest
    manifest = {}
    total_ms = 0
    for slide_id, filename, duration_ms in results:
        manifest[slide_id] = {"file": filename, "durationMs": duration_ms}
        total_ms += duration_ms

    manifest_json = json.dumps(manifest, indent=2) + "\n"
    MANIFEST_PATH.write_text(manifest_json)

    # Also write to src/data/ where Remotion imports it at build time
    src_manifest = Path(__file__).parent / "src" / "data" / "manifest.json"
    src_manifest.write_text(manifest_json)

    total_s = total_ms / 1000
    print(f"\nDone. {len(results)} slides, {total_s:.1f}s total narration")
    print(f"Manifest: {MANIFEST_PATH} (+ {src_manifest})")


if __name__ == "__main__":
    asyncio.run(main())
