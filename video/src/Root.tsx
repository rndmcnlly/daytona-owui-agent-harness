import { Composition, Still, Folder } from "remotion";
import { CANVAS } from "./design";
import { SCRIPT, ALL_SLIDES } from "./data/script";
import { PartComposition, getPartDurationFrames } from "./PartComposition";
import { SlideRenderer } from "./slides/SlideRenderer";

export const RemotionRoot: React.FC = () => {
  // Full video: all parts concatenated
  const totalFrames = SCRIPT.reduce(
    (acc, part) => acc + getPartDurationFrames(part, CANVAS.fps),
    0
  );

  return (
    <>
      {/* Full explainer video */}
      <Composition
        id="LatheExplainer"
        component={LatheExplainer}
        durationInFrames={totalFrames}
        fps={CANVAS.fps}
        width={CANVAS.width}
        height={CANVAS.height}
      />

      {/* Individual parts for preview */}
      <Folder name="Parts">
        {SCRIPT.map((part) => (
          <Composition
            key={part.id}
            id={`Part-${part.id}`}
            component={() => <PartComposition part={part} />}
            durationInFrames={getPartDurationFrames(part, CANVAS.fps)}
            fps={CANVAS.fps}
            width={CANVAS.width}
            height={CANVAS.height}
          />
        ))}
      </Folder>

      {/* Stills for every slide (PDF export) */}
      <Folder name="Stills">
        {SCRIPT.map((part) =>
          part.slides.map((slide) => (
            <Still
              key={slide.id}
              id={`still-${slide.id}`}
              component={() => (
                <SlideRenderer visual={slide.visual} partId={part.id} />
              )}
              width={CANVAS.width}
              height={CANVAS.height}
            />
          ))
        )}
      </Folder>
    </>
  );
};

// Full video component: sequences all parts with progress bar overlay
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ProgressBar } from "./ProgressBar";

const LatheExplainer: React.FC = () => {
  let offset = 0;

  return (
    <AbsoluteFill>
      {SCRIPT.map((part) => {
        const duration = getPartDurationFrames(part, CANVAS.fps);
        const partOffset = offset;
        offset += duration;

        return (
          <Sequence
            key={part.id}
            from={partOffset}
            durationInFrames={duration}
          >
            <PartComposition part={part} />
          </Sequence>
        );
      })}

      {/* Progress bar overlay — spans the entire video */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
