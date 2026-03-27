// Animated architecture diagram: User → Open WebUI → Lathe → Daytona Sandbox
// SVG boxes with animated connection lines and data flow particles

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONTS, PART_THEMES } from "../design";

const BOX_W = 280;
const BOX_H = 140;
const BOX_Y = 340;
const BOXES = [
  { x: 120, label: "You", sublabel: "(Open WebUI)", color: COLORS.accent },
  { x: 520, label: "Lathe", sublabel: "(OWUI toolkit)", color: COLORS.highlight },
  { x: 920, label: "Sandbox", sublabel: "(Daytona VM)", color: COLORS.green },
];

const ARROW_Y = BOX_Y + BOX_H / 2;

export const ArchDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const isStill = durationInFrames === 1;
  const theme = PART_THEMES["spin-up"];

  // Staggered box entrance
  const boxProgress = BOXES.map((_, i) =>
    isStill
      ? 1
      : spring({ frame: frame - i * 10, fps, config: { damping: 200 } })
  );

  // Arrow draw-on after boxes appear
  const arrow1 = isStill
    ? 1
    : interpolate(frame, [25, 45], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const arrow2 = isStill
    ? 1
    : interpolate(frame, [35, 55], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  // Data flow particles (looping)
  const particlePhase = isStill ? 0.5 : (frame % 60) / 60;
  const returnPhase = isStill ? 0.5 : ((frame + 30) % 60) / 60;

  // Labels for the arrows
  const label1Progress = isStill
    ? 1
    : spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const label2Progress = isStill
    ? 1
    : spring({ frame: frame - 50, fps, config: { damping: 200 } });

  return (
    <div style={{ width: "100%", maxWidth: 1400, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox="0 0 1320 700"
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          {/* Glow filter for boxes */}
          <filter id="boxGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Arrow marker */}
          <marker
            id="arrowHead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.textMuted} />
          </marker>
          <marker
            id="arrowHeadReturn"
            markerWidth="10"
            markerHeight="7"
            refX="1"
            refY="3.5"
            orient="auto"
          >
            <polygon points="10 0, 0 3.5, 10 7" fill={`${COLORS.textMuted}88`} />
          </marker>
        </defs>

        {/* Connection lines (forward) */}
        <line
          x1={120 + BOX_W}
          y1={ARROW_Y - 15}
          x2={520}
          y2={ARROW_Y - 15}
          stroke={COLORS.textMuted}
          strokeWidth={2}
          strokeDasharray={`${arrow1 * 120}`}
          strokeDashoffset={0}
          markerEnd="url(#arrowHead)"
          opacity={arrow1}
        />
        <line
          x1={520 + BOX_W}
          y1={ARROW_Y - 15}
          x2={920}
          y2={ARROW_Y - 15}
          stroke={COLORS.textMuted}
          strokeWidth={2}
          strokeDasharray={`${arrow2 * 120}`}
          strokeDashoffset={0}
          markerEnd="url(#arrowHead)"
          opacity={arrow2}
        />

        {/* Return lines */}
        <line
          x1={520}
          y1={ARROW_Y + 15}
          x2={120 + BOX_W}
          y2={ARROW_Y + 15}
          stroke={`${COLORS.textMuted}88`}
          strokeWidth={2}
          strokeDasharray="6 4"
          markerEnd="url(#arrowHeadReturn)"
          opacity={arrow1 * 0.6}
        />
        <line
          x1={920}
          y1={ARROW_Y + 15}
          x2={520 + BOX_W}
          y2={ARROW_Y + 15}
          stroke={`${COLORS.textMuted}88`}
          strokeWidth={2}
          strokeDasharray="6 4"
          markerEnd="url(#arrowHeadReturn)"
          opacity={arrow2 * 0.6}
        />

        {/* Arrow labels */}
        <text
          x={(120 + BOX_W + 520) / 2}
          y={ARROW_Y - 30}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={18}
          fontFamily={FONTS.mono}
          opacity={Math.max(0, label1Progress)}
        >
          tool calls
        </text>
        <text
          x={(120 + BOX_W + 520) / 2}
          y={ARROW_Y + 40}
          textAnchor="middle"
          fill={`${COLORS.textMuted}88`}
          fontSize={18}
          fontFamily={FONTS.mono}
          opacity={Math.max(0, label1Progress)}
        >
          tool results
        </text>
        <text
          x={(520 + BOX_W + 920) / 2}
          y={ARROW_Y - 30}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={18}
          fontFamily={FONTS.mono}
          opacity={Math.max(0, label2Progress)}
        >
          API
        </text>
        <text
          x={(520 + BOX_W + 920) / 2}
          y={ARROW_Y + 40}
          textAnchor="middle"
          fill={`${COLORS.textMuted}88`}
          fontSize={18}
          fontFamily={FONTS.mono}
          opacity={Math.max(0, label2Progress)}
        >
          stdout
        </text>

        {/* Flowing particles (forward direction) */}
        {arrow1 > 0.8 && !isStill && (
          <circle
            cx={interpolate(particlePhase, [0, 1], [120 + BOX_W + 10, 520 - 10])}
            cy={ARROW_Y - 15}
            r={4}
            fill={COLORS.accent}
            opacity={0.8}
          />
        )}
        {arrow2 > 0.8 && !isStill && (
          <circle
            cx={interpolate(particlePhase, [0, 1], [520 + BOX_W + 10, 920 - 10])}
            cy={ARROW_Y - 15}
            r={4}
            fill={COLORS.highlight}
            opacity={0.8}
          />
        )}
        {/* Return particles */}
        {arrow1 > 0.8 && !isStill && (
          <circle
            cx={interpolate(returnPhase, [0, 1], [520 - 10, 120 + BOX_W + 10])}
            cy={ARROW_Y + 15}
            r={3}
            fill={`${COLORS.accent}88`}
            opacity={0.6}
          />
        )}

        {/* Boxes */}
        {BOXES.map((box, i) => {
          const p = boxProgress[i];
          const scale = interpolate(p, [0, 1], [0.8, 1]);
          const cx = box.x + BOX_W / 2;
          const cy = BOX_Y + BOX_H / 2;

          return (
            <g
              key={box.label}
              transform={`translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`}
              opacity={Math.max(0, p)}
            >
              {/* Glow behind */}
              <rect
                x={box.x}
                y={BOX_Y}
                width={BOX_W}
                height={BOX_H}
                rx={16}
                fill={`${box.color}11`}
                stroke={`${box.color}44`}
                strokeWidth={2}
                filter="url(#boxGlow)"
              />
              {/* Main box */}
              <rect
                x={box.x}
                y={BOX_Y}
                width={BOX_W}
                height={BOX_H}
                rx={16}
                fill={COLORS.bgCard}
                stroke={`${box.color}88`}
                strokeWidth={2}
              />
              {/* Label */}
              <text
                x={cx}
                y={BOX_Y + 58}
                textAnchor="middle"
                fill={box.color}
                fontSize={30}
                fontWeight={700}
                fontFamily={FONTS.body}
              >
                {box.label}
              </text>
              {/* Sublabel */}
              <text
                x={cx}
                y={BOX_Y + 88}
                textAnchor="middle"
                fill={COLORS.textMuted}
                fontSize={18}
                fontFamily={FONTS.body}
              >
                {box.sublabel}
              </text>
            </g>
          );
        })}

        {/* Title */}
        <text
          x={660}
          y={200}
          textAnchor="middle"
          fill={COLORS.text}
          fontSize={42}
          fontWeight={700}
          fontFamily={FONTS.body}
          opacity={Math.max(0, boxProgress[0])}
        >
          Chat in, code out
        </text>

        {/* Subtitle */}
        <text
          x={660}
          y={580}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={22}
          fontFamily={FONTS.body}
          opacity={Math.max(0, label2Progress)}
        >
          Every tool call executes in the user's sandbox. Results flow back as tool results.
        </text>
      </svg>
    </div>
  );
};
