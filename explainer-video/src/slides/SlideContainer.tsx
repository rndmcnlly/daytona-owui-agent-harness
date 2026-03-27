// Shared wrapper for all slide types — background, part accent stripe, padding

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { COLORS, FONTS, PART_THEMES, type PartId } from "../design";

type Props = {
  partId: PartId;
  children: React.ReactNode;
};

export const SlideContainer: React.FC<Props> = ({ partId, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = PART_THEMES[partId];

  // Fade in (guard for stills)
  const fadeIn =
    durationInFrames === 1
      ? 1
      : interpolate(frame, [0, 12], [0, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bgTint,
        fontFamily: FONTS.body,
        color: COLORS.text,
        opacity: fadeIn,
      }}
    >
      {/* Subtle grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(${COLORS.bgCard}44 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.bgCard}44 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentMuted})`,
        }}
      />
      {/* Content area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 120px",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
