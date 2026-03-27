// Animated lifecycle diagram: Spin Up → Work → Spin Down → (repeat)
// Circular flow showing the three phases with looping arrow

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONTS, PART_THEMES } from "../design";

const CX = 660;
const CY = 360;
const RADIUS = 220;

// Three phases arranged in a triangle/circle
const PHASES = [
  {
    label: "Spin Up",
    sublabel: "VM created on first tool call",
    angle: -90, // top
    color: PART_THEMES["spin-up"].accent,
  },
  {
    label: "Get to Work",
    sublabel: "bash, files, expose, onboard",
    angle: 30, // bottom-right
    color: PART_THEMES["work"].accent,
  },
  {
    label: "Spin Down",
    sublabel: "Auto-sleep, persist, wake later",
    angle: 150, // bottom-left
    color: PART_THEMES["spin-down"].accent,
  },
];

function polarToXY(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

const BOX_W = 260;
const BOX_H = 100;

export const LifecycleDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const isStill = durationInFrames === 1;

  // Staggered entrance for each phase
  const phaseProgress = PHASES.map((_, i) =>
    isStill
      ? 1
      : spring({ frame: frame - i * 12, fps, config: { damping: 200 } })
  );

  // Connecting arcs appear after all boxes
  const arcProgress = isStill
    ? 1
    : interpolate(frame, [40, 65], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  // Rotating highlight pulse (loops every 90 frames = 3s)
  const pulsePhase = isStill ? -1 : (frame % 90) / 90;
  const activeIndex = isStill ? -1 : Math.floor(pulsePhase * 3);

  // Tagline fade
  const taglineProgress = isStill
    ? 1
    : spring({ frame: frame - 50, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      <svg viewBox="0 0 1320 720" style={{ width: "100%", height: "auto" }}>
        <defs>
          <filter id="lcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <marker
            id="lcArrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.textMuted} />
          </marker>
        </defs>

        {/* Curved arrows between phases */}
        {PHASES.map((_, i) => {
          const nextI = (i + 1) % PHASES.length;
          const startAngle = PHASES[i].angle;
          const endAngle = PHASES[nextI].angle;

          // Arc midpoint control — push outward slightly
          const midAngle = (startAngle + endAngle) / 2;
          // Handle wrap-around for the last → first arc
          const effectiveMid =
            i === 2 ? startAngle + (360 + endAngle - startAngle) / 2 : midAngle;

          const [sx, sy] = polarToXY(startAngle, RADIUS - 60);
          const [ex, ey] = polarToXY(endAngle, RADIUS - 60);
          const [cx2, cy2] = polarToXY(effectiveMid, RADIUS + 40);

          return (
            <path
              key={`arc-${i}`}
              d={`M ${sx} ${sy} Q ${cx2} ${cy2} ${ex} ${ey}`}
              fill="none"
              stroke={`${COLORS.textMuted}88`}
              strokeWidth={2}
              strokeDasharray={`${arcProgress * 300}`}
              markerEnd="url(#lcArrow)"
              opacity={arcProgress * 0.7}
            />
          );
        })}

        {/* Phase nodes */}
        {PHASES.map((phase, i) => {
          const [px, py] = polarToXY(phase.angle, RADIUS);
          const p = phaseProgress[i];
          const scale = interpolate(p, [0, 1], [0.7, 1]);
          const isActive = i === activeIndex;
          const borderColor = isActive
            ? phase.color
            : `${phase.color}88`;
          const glow = isActive
            ? `0 0 20px ${phase.color}44`
            : "none";

          return (
            <g
              key={phase.label}
              transform={`translate(${px}, ${py}) scale(${scale}) translate(${-px}, ${-py})`}
              opacity={Math.max(0, p)}
            >
              {/* Box */}
              <rect
                x={px - BOX_W / 2}
                y={py - BOX_H / 2}
                width={BOX_W}
                height={BOX_H}
                rx={16}
                fill={COLORS.bgCard}
                stroke={borderColor}
                strokeWidth={isActive ? 3 : 2}
                filter={isActive ? "url(#lcGlow)" : undefined}
              />
              {/* Label */}
              <text
                x={px}
                y={py - 8}
                textAnchor="middle"
                fill={phase.color}
                fontSize={28}
                fontWeight={700}
                fontFamily={FONTS.body}
              >
                {phase.label}
              </text>
              {/* Sublabel */}
              <text
                x={px}
                y={py + 22}
                textAnchor="middle"
                fill={COLORS.textMuted}
                fontSize={16}
                fontFamily={FONTS.body}
              >
                {phase.sublabel}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={CX}
          y={CY - 10}
          textAnchor="middle"
          fill={COLORS.text}
          fontSize={36}
          fontWeight={700}
          fontFamily={FONTS.body}
          opacity={Math.max(0, taglineProgress)}
        >
          The Cycle
        </text>
        <text
          x={CX}
          y={CY + 24}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={20}
          fontFamily={FONTS.body}
          opacity={Math.max(0, taglineProgress)}
        >
          One toolkit. One API key.
        </text>
      </svg>
    </div>
  );
};
