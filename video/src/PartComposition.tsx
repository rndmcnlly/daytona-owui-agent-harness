// Sequences slides within a Part, with audio timing from manifest.json

import React from "react";
import { Sequence, Audio, staticFile, useVideoConfig } from "remotion";
import type { Part, Slide } from "./data/script";
import { TIMING } from "./design";
import { SlideRenderer } from "./slides/SlideRenderer";
import manifestData from "./data/manifest.json";

// Audio manifest: maps slide id → { file, durationMs }
type ManifestEntry = { file: string; durationMs: number };
type Manifest = Record<string, ManifestEntry>;

const manifest: Manifest = manifestData as Manifest;

function getSlideFrames(slide: Slide, fps: number): number {
  if (manifest[slide.id]) {
    const ms = manifest[slide.id].durationMs;
    return Math.ceil((ms / 1000) * fps);
  }
  // Fallback estimate: ~150 words per minute narration
  const words = slide.narration.split(/\s+/).length;
  const seconds = (words / 150) * 60;
  return Math.ceil(seconds * fps);
}

type Props = {
  part: Part;
};

export const PartComposition: React.FC<Props> = ({ part }) => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;

  return (
    <>
      {part.slides.map((slide, i) => {
        const isSection = slide.sectionStart && i > 0;
        const leadIn = isSection ? TIMING.SECTION_LEAD_IN : TIMING.SLIDE_LEAD_IN;
        const tail = isSection ? TIMING.SECTION_TAIL : TIMING.SLIDE_TAIL;
        const audioDuration = getSlideFrames(slide, fps);
        const totalDuration = leadIn + audioDuration + tail;

        const slideStart = currentFrame;
        currentFrame += totalDuration;

        const hasAudio = !!manifest[slide.id];

        return (
          <Sequence
            key={slide.id}
            from={slideStart}
            durationInFrames={totalDuration}
            premountFor={fps}
          >
            {/* Visual */}
            <SlideRenderer visual={slide.visual} partId={part.id} />

            {/* Audio (offset by lead-in so visual lands before voice) */}
            {hasAudio && (
              <Sequence from={leadIn} durationInFrames={audioDuration}>
                <Audio src={staticFile(`audio/${manifest[slide.id].file}`)} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
    </>
  );
};

// Calculate total duration for a part (needed for Composition registration)
export function getPartDurationFrames(part: Part, fps: number): number {
  let total = 0;
  part.slides.forEach((slide, i) => {
    const isSection = slide.sectionStart && i > 0;
    const leadIn = isSection ? TIMING.SECTION_LEAD_IN : TIMING.SLIDE_LEAD_IN;
    const tail = isSection ? TIMING.SECTION_TAIL : TIMING.SLIDE_TAIL;
    const audioDuration = getSlideFrames(slide, fps);
    total += leadIn + audioDuration + tail;
  });
  return total;
}
