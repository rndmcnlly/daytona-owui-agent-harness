// Animated lifecycle flow diagram showing _ensure_sandbox logic
// Vertical flowchart with decision diamonds and state boxes

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONTS, PART_THEMES } from "../design";

type NodeType = "action" | "decision" | "state";

type FlowNode = {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  x: number;
  y: number;
};

type FlowEdge = {
  from: string;
  to: string;
  label?: string;
  curved?: boolean;
};

const NODES: FlowNode[] = [
  { id: "call", label: "Tool called", type: "action", x: 460, y: 60 },
  { id: "lookup", label: "Find sandbox", sublabel: "by email + label", type: "action", x: 460, y: 175 },
  { id: "exists", label: "Found?", type: "decision", x: 460, y: 290 },
  { id: "create", label: "Create", sublabel: "+ volume", type: "action", x: 220, y: 380 },
  { id: "state", label: "State?", type: "decision", x: 660, y: 380 },
  { id: "start", label: "Start / Recover", type: "action", x: 660, y: 490 },
  { id: "poll", label: "Poll until ready", type: "action", x: 460, y: 560 },
  { id: "ready", label: "Sandbox ready", sublabel: "execute tool", type: "state", x: 460, y: 670 },
];

const nodeMap = new Map(NODES.map((n) => [n.id, n]));

const EDGES: FlowEdge[] = [
  { from: "call", to: "lookup" },
  { from: "lookup", to: "exists" },
  { from: "exists", to: "create", label: "no" },
  { from: "exists", to: "state", label: "yes" },
  { from: "create", to: "poll" },
  { from: "state", to: "start", label: "stopped/error" },
  { from: "state", to: "ready", label: "running" },
  { from: "start", to: "poll" },
  { from: "poll", to: "ready" },
];

const NODE_W = 200;
const NODE_H = 64;
const DIAMOND_R = 42;

export const FlowDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = PART_THEMES["spin-up"];
  const isStill = durationInFrames === 1;

  // Each node appears in sequence
  const nodeProgress = NODES.map((_, i) =>
    isStill
      ? 1
      : spring({ frame: frame - i * 5, fps, config: { damping: 200 } })
  );

  // Edges appear after their source node
  const edgeDelay = (fromId: string): number => {
    const idx = NODES.findIndex((n) => n.id === fromId);
    return (idx + 1) * 5 + 4;
  };

  const getNodeCenter = (id: string): [number, number] => {
    const n = nodeMap.get(id)!;
    return [n.x, n.y];
  };

  const getNodeBottom = (id: string): [number, number] => {
    const n = nodeMap.get(id)!;
    if (n.type === "decision") return [n.x, n.y + DIAMOND_R];
    return [n.x, n.y + NODE_H / 2];
  };

  const getNodeTop = (id: string): [number, number] => {
    const n = nodeMap.get(id)!;
    if (n.type === "decision") return [n.x, n.y - DIAMOND_R];
    return [n.x, n.y - NODE_H / 2];
  };

  const getNodeLeft = (id: string): [number, number] => {
    const n = nodeMap.get(id)!;
    if (n.type === "decision") return [n.x - DIAMOND_R, n.y];
    return [n.x - NODE_W / 2, n.y];
  };

  const getNodeRight = (id: string): [number, number] => {
    const n = nodeMap.get(id)!;
    if (n.type === "decision") return [n.x + DIAMOND_R, n.y];
    return [n.x + NODE_W / 2, n.y];
  };

  const renderEdge = (edge: FlowEdge, i: number) => {
    const delay = edgeDelay(edge.from);
    const progress = isStill
      ? 1
      : interpolate(frame, [delay, delay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

    const fromNode = nodeMap.get(edge.from)!;
    const toNode = nodeMap.get(edge.to)!;

    let [x1, y1] = getNodeBottom(edge.from);
    let [x2, y2] = getNodeTop(edge.to);

    // Adjust for horizontal connections from diamonds
    if (fromNode.type === "decision" && toNode.x < fromNode.x) {
      [x1, y1] = getNodeLeft(edge.from);
      [x2, y2] = getNodeTop(edge.to);
    } else if (fromNode.type === "decision" && toNode.x > fromNode.x) {
      [x1, y1] = getNodeRight(edge.from);
      [x2, y2] = getNodeTop(edge.to);
    }

    // For "state → ready" (diagonal right→down→left), use right exit
    if (edge.from === "state" && edge.to === "ready") {
      [x1, y1] = getNodeBottom(edge.from);
      // Curve to the right then down
    }

    // Build path
    let d: string;
    if (x1 === x2) {
      // Straight vertical
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
    } else {
      // L-shaped or curved path
      const midY = (y1 + y2) / 2;
      d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
    }

    return (
      <g key={`edge-${i}`} opacity={progress}>
        <path
          d={d}
          fill="none"
          stroke={theme.accent}
          strokeWidth={2}
          strokeDasharray="none"
        />
        {/* Arrow tip */}
        <polygon
          points={`${x2 - 5},${y2 - 8} ${x2},${y2} ${x2 + 5},${y2 - 8}`}
          fill={theme.accent}
        />
        {/* Edge label */}
        {edge.label && (
          <text
            x={(x1 + x2) / 2 + (x1 === x2 ? 16 : 0)}
            y={(y1 + y2) / 2 - 8}
            textAnchor="middle"
            fill={theme.accent}
            fontSize={16}
            fontFamily={FONTS.mono}
            fontWeight={600}
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  const renderNode = (node: FlowNode, i: number) => {
    const p = nodeProgress[i];
    const scale = interpolate(p, [0, 1], [0.8, 1]);
    const cx = node.x;
    const cy = node.y;

    const colorMap: Record<NodeType, string> = {
      action: theme.accent,
      decision: COLORS.highlight,
      state: COLORS.green,
    };
    const nodeColor = colorMap[node.type];

    return (
      <g
        key={node.id}
        transform={`translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`}
        opacity={Math.max(0, p)}
      >
        {node.type === "decision" ? (
          <>
            <polygon
              points={`${cx},${cy - DIAMOND_R} ${cx + DIAMOND_R},${cy} ${cx},${cy + DIAMOND_R} ${cx - DIAMOND_R},${cy}`}
              fill={COLORS.bgCard}
              stroke={`${nodeColor}88`}
              strokeWidth={2}
            />
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fill={nodeColor}
              fontSize={18}
              fontWeight={600}
              fontFamily={FONTS.body}
            >
              {node.label}
            </text>
          </>
        ) : (
          <>
            <rect
              x={cx - NODE_W / 2}
              y={cy - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={node.type === "state" ? 32 : 12}
              fill={COLORS.bgCard}
              stroke={`${nodeColor}88`}
              strokeWidth={2}
            />
            <text
              x={cx}
              y={node.sublabel ? cy - 4 : cy + 5}
              textAnchor="middle"
              fill={nodeColor}
              fontSize={18}
              fontWeight={700}
              fontFamily={FONTS.body}
            >
              {node.label}
            </text>
            {node.sublabel && (
              <text
                x={cx}
                y={cy + 18}
                textAnchor="middle"
                fill={COLORS.textMuted}
                fontSize={14}
                fontFamily={FONTS.body}
              >
                {node.sublabel}
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  return (
    <div style={{ display: "flex", gap: 60, width: "100%", maxWidth: 1500, alignItems: "center" }}>
      {/* Flow chart */}
      <div style={{ flex: "0 0 55%" }}>
        <svg viewBox="40 20 820 730" style={{ width: "100%", height: "auto" }}>
          {EDGES.map((e, i) => renderEdge(e, i))}
          {NODES.map((n, i) => renderNode(n, i))}
        </svg>
      </div>
      {/* Side description */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.text,
            opacity: isStill ? 1 : Math.max(0, spring({ frame, fps, config: { damping: 200 } })),
          }}
        >
          Transparent lifecycle
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.6,
            color: COLORS.textMuted,
            opacity: isStill ? 1 : Math.max(0, spring({ frame: frame - 8, fps, config: { damping: 200 } })),
          }}
        >
          Every tool call passes through <span style={{ color: COLORS.highlight, fontFamily: FONTS.mono }}>_ensure_sandbox</span>.
          The model never manages lifecycle — it just calls tools and gets results.
        </div>
        <div
          style={{
            fontSize: 22,
            lineHeight: 1.5,
            color: `${COLORS.textMuted}aa`,
            opacity: isStill ? 1 : Math.max(0, spring({ frame: frame - 16, fps, config: { damping: 200 } })),
            fontFamily: FONTS.mono,
          }}
        >
          create → start → poll → ready
        </div>
      </div>
    </div>
  );
};
