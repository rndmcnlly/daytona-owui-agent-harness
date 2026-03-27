// Structured progress bar across the top of the video
// Shows Part > Slide nesting with current position highlighted

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { COLORS, FONTS, PART_THEMES, TIMING } from "./design";
import { SCRIPT, type Part, type Slide } from "./data/script";
import manifestData from "./data/manifest.json";

type ManifestEntry = { file: string; durationMs: number };
const manifest = manifestData as Record<string, ManifestEntry>;

function getSlideFrames(slide: Slide, fps: number): number {
  if (manifest[slide.id]) {
    return Math.ceil((manifest[slide.id].durationMs / 1000) * fps);
  }
  const words = slide.narration.split(/\s+/).length;
  return Math.ceil(((words / 150) * 60) * fps);
}

// Pre-compute the full timeline structure
type SlideSpan = {
  slideId: string;
  partIndex: number;
  slideIndex: number;
  globalStart: number;
  duration: number;
};

type PartSpan = {
  partId: string;
  label: string;
  globalStart: number;
  duration: number;
  slides: SlideSpan[];
};

function buildTimeline(fps: number): { parts: PartSpan[]; totalFrames: number } {
  const parts: PartSpan[] = [];
  let globalFrame = 0;

  for (let pi = 0; pi < SCRIPT.length; pi++) {
    const part = SCRIPT[pi];
    const partStart = globalFrame;
    const slides: SlideSpan[] = [];

    for (let si = 0; si < part.slides.length; si++) {
      const slide = part.slides[si];
      const isSection = slide.sectionStart && si > 0;
      const leadIn = isSection ? TIMING.SECTION_LEAD_IN : TIMING.SLIDE_LEAD_IN;
      const tail = isSection ? TIMING.SECTION_TAIL : TIMING.SLIDE_TAIL;
      const audioDuration = getSlideFrames(slide, fps);
      const totalDuration = leadIn + audioDuration + tail;

      slides.push({
        slideId: slide.id,
        partIndex: pi,
        slideIndex: si,
        globalStart: globalFrame,
        duration: totalDuration,
      });

      globalFrame += totalDuration;
    }

    parts.push({
      partId: part.id,
      label: PART_THEMES[part.id as keyof typeof PART_THEMES].label,
      globalStart: partStart,
      duration: globalFrame - partStart,
      slides,
    });
  }

  return { parts, totalFrames: globalFrame };
}

// ── Component ─────────────────────────────────────────────────────

const BAR_TOP = 16;
const BAR_HEIGHT = 6;
const BAR_MARGIN_X = 60;
const LABEL_HEIGHT = 20;
const TOTAL_HEIGHT = BAR_TOP + LABEL_HEIGHT + BAR_HEIGHT + 12;
const PART_GAP = 6;
const SLIDE_GAP = 2;

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Don't render in stills
  if (durationInFrames === 1) return null;

  const { parts, totalFrames } = buildTimeline(fps);
  const barWidth = width - BAR_MARGIN_X * 2;

  // Fade in over first second, stay visible
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Find current part and slide
  let currentPartIndex = 0;
  let currentSlideIndex = 0;
  for (const part of parts) {
    for (const slide of part.slides) {
      if (frame >= slide.globalStart && frame < slide.globalStart + slide.duration) {
        currentPartIndex = slide.partIndex;
        currentSlideIndex = slide.slideIndex;
      }
    }
  }

  // Total gap space to subtract from available width
  const totalPartGaps = (parts.length - 1) * PART_GAP;
  const usableWidth = barWidth - totalPartGaps;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: TOTAL_HEIGHT,
        opacity,
        zIndex: 100,
      }}
    >
      {/* Scrim behind the bar for readability */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: TOTAL_HEIGHT + 16,
          background: `linear-gradient(to bottom, ${COLORS.bg}cc, ${COLORS.bg}00)`,
        }}
      />

      {/* Parts */}
      <div
        style={{
          position: "absolute",
          top: BAR_TOP,
          left: BAR_MARGIN_X,
          width: barWidth,
          display: "flex",
          gap: PART_GAP,
        }}
      >
        {parts.map((part, pi) => {
          const partFrac = part.duration / totalFrames;
          const partWidth = usableWidth * partFrac;
          const theme = PART_THEMES[part.partId as keyof typeof PART_THEMES];
          const isCurrentPart = pi === currentPartIndex;

          // Gap space for slides within this part
          const slideGaps = (part.slides.length - 1) * SLIDE_GAP;
          const slideUsable = partWidth - slideGaps;

          return (
            <div key={part.partId} style={{ width: partWidth }}>
              {/* Act label */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: FONTS.body,
                  color: isCurrentPart ? theme.accent : `${COLORS.textMuted}88`,
                  marginBottom: 4,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {part.label}
              </div>

              {/* Slide segments */}
              <div
                style={{
                  display: "flex",
                  gap: SLIDE_GAP,
                  height: BAR_HEIGHT,
                }}
              >
                {part.slides.map((slide, si) => {
                  const slideFrac = slide.duration / part.duration;
                  const slideWidth = slideUsable * slideFrac;

                  const isCurrent = pi === currentPartIndex && si === currentSlideIndex;
                  const isPast =
                    pi < currentPartIndex ||
                    (pi === currentPartIndex && si < currentSlideIndex);

                  // Progress within current slide
                  const slideProgress = isCurrent
                    ? Math.min(1, (frame - slide.globalStart) / slide.duration)
                    : isPast
                      ? 1
                      : 0;

                  return (
                    <div
                      key={slide.slideId}
                      style={{
                        width: slideWidth,
                        height: BAR_HEIGHT,
                        borderRadius: BAR_HEIGHT / 2,
                        backgroundColor: `${theme.accent}22`,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* Fill */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: `${slideProgress * 100}%`,
                          height: "100%",
                          borderRadius: BAR_HEIGHT / 2,
                          backgroundColor: isCurrent
                            ? theme.accent
                            : isPast
                              ? `${theme.accent}88`
                              : "transparent",
                          boxShadow: isCurrent
                            ? `0 0 8px ${theme.accent}66`
                            : "none",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
