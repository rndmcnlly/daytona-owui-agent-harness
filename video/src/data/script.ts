// Typed slide data for the Lathe explainer video
// Narrative: spin up, get to work, spin down

import type { PartId } from "../design";

// Visual types for slide rendering
export type SlideVisual =
  | { type: "title"; title: string; subtitle?: string }
  | { type: "headline"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "text"; body: string }
  | { type: "diagram-arch" }
  | { type: "diagram-lifecycle" }
  | {
      type: "tool-grid";
      tools: { name: string; desc: string; icon: string }[];
    }
  | { type: "code-block"; code: string; language: string; caption?: string }
  | { type: "callout"; icon: string; heading: string; body: string }
  | {
      type: "chat";
      messages: { role: "user" | "agent" | "tool"; text: string }[];
    }
  | {
      type: "tool-call";
      tool: string;
      args: string;
      result: string;
      icon: string;
    }
  | {
      type: "scene";
      leftLabel: string;
      leftLines: string[];
      rightLabel: string;
      rightLines: string[];
    }
  | {
      type: "inspiration";
      clips: { label: string; file: string; url: string }[];
      tagline: string;
    };

export type Slide = {
  id: string;
  narration: string;
  visual: SlideVisual;
  sectionStart?: boolean;
};

export type Part = {
  id: PartId;
  label: string;
  slides: Slide[];
};

// ── Act 1: Spin Up ───────────────────────────────────────────────
// The sandbox materializes transparently on first tool call

const spinUp: Part = {
  id: "spin-up",
  label: "Spin Up",
  slides: [
    {
      id: "title",
      narration:
        "Lathe is an agent harness for Open WebUI. Inspired by coding agents like Pi and OpenCode — but built for the browser.",
      visual: {
        type: "title",
        title: "Lathe",
        subtitle: "An agent harness for Open WebUI",
      },
      sectionStart: true,
    },
    {
      id: "the-landscape",
      narration:
        "Terminal coding agents are everywhere now. They're fast, capable, and deeply integrated with developer workflows. But they assume you're at a workstation with a shell. Lathe brings that same agent surface to Open WebUI — any model, any browser, no local setup.",
      visual: {
        type: "inspiration",
        clips: [
          { label: "Pi", file: "pi-demo.mp4", url: "pi.dev" },
          { label: "OpenCode", file: "opencode-demo.mp4", url: "opencode.ai" },
        ],
        tagline:
          "Lathe brings this to the browser — any model, no local setup.",
      },
    },
    {
      id: "first-message",
      narration:
        "A user opens their browser and starts a conversation. Nothing special yet — just a chat window. But the moment the model reaches for a tool, something happens.",
      visual: {
        type: "chat",
        messages: [
          {
            role: "user",
            text: "I have a project repo I need to work on. Can you clone it and get oriented?",
          },
          {
            role: "agent",
            text: "Sure — let me pull that down and take a look.",
          },
        ],
      },
      sectionStart: true,
    },
    {
      id: "sandbox-spins-up",
      narration:
        "A sandbox spins up. A full Linux VM, provisioned on demand, dedicated to this user. The model didn't ask for it. The user didn't configure it. Lathe handled the lifecycle transparently — create, start, wait for ready.",
      visual: {
        type: "code-block",
        language: "text",
        code: `⠋ Spinning up sandbox...
  Creating VM for user@example.com
  Starting sandbox instance
  Waiting for toolbox daemon...
✓ Sandbox ready (4.2s)

$ bash("git clone https://github.com/...")
Cloning into '/home/daytona/workspace'...
✓ Done`,
        caption: "First tool call triggers sandbox creation",
      },
    },
    {
      id: "arch-overview",
      narration:
        "The architecture is simple. The user talks to a model in Open WebUI. The model calls Lathe's tools. Each tool executes in a Daytona sandbox. Results flow back as tool output the model reasons about.",
      visual: {
        type: "diagram-arch",
      },
    },
  ],
};

// ── Act 2: Get to Work ──────────────────────────────────────────
// The agent is productive. Key beats: working with code, onboard for
// project context, and expose() to break beyond the chat window.

const work: Part = {
  id: "work",
  label: "Get to Work",
  slides: [
    {
      id: "clones-repo",
      narration:
        "The agent clones the repo and explores the project structure. Shell commands, file reads, edits — the full surface of a coding agent, running in the sandbox.",
      visual: {
        type: "tool-call",
        tool: "bash",
        args: '"ls -la /home/daytona/workspace/"',
        result:
          "total 48\ndrwxr-xr-x  8 daytona daytona 4096 Mar 26 09:14 .\n-rw-r--r--  1 daytona daytona 1247 Mar 26 09:14 README.md\n-rw-r--r--  1 daytona daytona  892 Mar 26 09:14 AGENTS.md\ndrwxr-xr-x  4 daytona daytona 4096 Mar 26 09:14 src/\n-rw-r--r--  1 daytona daytona  340 Mar 26 09:14 package.json\ndrwxr-xr-x  2 daytona daytona 4096 Mar 26 09:14 tests/",
        icon: "terminal",
      },
      sectionStart: true,
    },
    {
      id: "onboards",
      narration:
        "Then it calls onboard. This loads project-specific instructions, conventions, and context — all in one shot. The agent picks up the project's norms the same way a new teammate would read the contributing guide.",
      visual: {
        type: "tool-call",
        tool: "onboard",
        args: "",
        result:
          "Loaded project context from AGENTS.md:\n\n• Test with: npm test\n• Style: Prettier, no semicolons\n• Branch convention: feature/<name>\n• Deploy: push to main triggers CI\n\n3 files indexed, 1 convention file loaded.",
        icon: "book",
      },
    },
    {
      id: "builds-something",
      narration:
        "The agent gets to work. It writes code, installs dependencies, starts a dev server. Each step is a tool call — visible in the conversation as it happens. Packages stay installed across conversations because the sandbox is persistent.",
      visual: {
        type: "code-block",
        language: "text",
        code: `$ write("/home/daytona/workspace/src/api.ts",
    "import express from 'express'\\n...")
✓ Wrote 1.2 KB

$ bash("npm install && npm run dev")
added 47 packages in 3.1s
Server listening on port 3000

$ bash("npm test")
✓ 12 tests passed`,
        caption: "Agent writes, installs, runs, tests",
      },
    },
    {
      id: "expose-moment",
      narration:
        "Now here's where it gets interesting. The agent calls expose — and the user gets a public URL to whatever's running in the sandbox. A web app. A file browser. A full VS Code instance. The interaction breaks out of the chat window.",
      visual: {
        type: "tool-call",
        tool: "expose",
        args: "port=8080",
        result:
          "Public URL (valid ~1 hour):\nhttps://8080-sandbox-abc123.proxy.daytona.io/\n  ?token=eyJ...\n\nVS Code in the browser — full terminal,\nextensions, file editing.",
        icon: "globe",
      },
      sectionStart: true,
    },
    {
      id: "beyond-chat",
      narration:
        "The user opens VS Code in one tab and the running app in another. They edit code directly while the agent makes structural changes through chat. Both work on the same filesystem, in the same sandbox, at the same time.",
      visual: {
        type: "scene",
        leftLabel: "User in VS Code",
        leftLines: [
          "Opens exposed URL in new tab",
          "Edits src/api.ts directly",
          "Saves — dev server hot-reloads",
        ],
        rightLabel: "Agent in chat",
        rightLines: [
          'edit("src/routes.ts", old, new)',
          "Adds authentication middleware",
          "Runs test suite after each change",
        ],
      },
    },
  ],
};

// ── Act 3: Spin Down ─────────────────────────────────────────────
// Session ends. Sandbox sleeps automatically. Projects persist.
// Coming back is seamless.

const spinDown: Part = {
  id: "spin-down",
  label: "Spin Down",
  slides: [
    {
      id: "session-ends",
      narration:
        "When the user is done, they just close the tab. The sandbox idles for a few minutes, then sleeps on its own. No teardown. No save button.",
      visual: {
        type: "chat",
        messages: [
          {
            role: "user",
            text: "That's good for today, thanks.",
          },
          {
            role: "agent",
            text: "Your sandbox will sleep automatically when idle. Files, packages, git history — all still there next time.",
          },
        ],
      },
      sectionStart: true,
    },
    {
      id: "any-device",
      narration:
        "And because the sandbox is in the cloud, it's not tied to a machine — it's tied to you. Start a conversation on your laptop at the office, then pick it up on your phone on the bus. Anywhere you can reach your Open WebUI server, your sandbox is there.",
      visual: {
        type: "scene",
        leftLabel: "Laptop",
        leftLines: [
          "Open chat.example.com",
          "Start a project, write code",
          "Close the lid and leave",
        ],
        rightLabel: "Phone",
        rightLines: [
          "Open chat.example.com",
          "\"Pick up where I left off\"",
          "Same sandbox, same files",
        ],
      },
    },
    {
      id: "comes-back",
      narration:
        "Days later, the user starts a new conversation. The sandbox wakes transparently on the first tool call. Files, packages, git history — all still there. The agent calls onboard and picks up the project context immediately.",
      visual: {
        type: "code-block",
        language: "text",
        code: `⠋ Waking sandbox...
✓ Sandbox ready (1.8s)

$ onboard()
Loaded project context from AGENTS.md
  Last modified: 3 days ago
  12 files in workspace, git history intact

$ bash("git log --oneline -3")
a1b2c3d Add auth middleware
e4f5g6h Initial API scaffold
i7j8k9l First commit`,
        caption: "New conversation, same workspace",
      },
    },
    {
      id: "the-cycle",
      narration:
        "That's the cycle. Spin up, get to work, spin down. The sandbox is infrastructure that appears when you need it and disappears when you don't. One toolkit. One API key. Every model on the server gets a coding agent surface.",
      visual: {
        type: "diagram-lifecycle",
      },
      sectionStart: true,
    },
    {
      id: "outro",
      narration: "Lathe. An agent harness for Open WebUI.",
      visual: {
        type: "title",
        title: "lathe.tools",
        subtitle: "github.com/rndmcnlly/lathe",
      },
    },
  ],
};

export const SCRIPT: Part[] = [spinUp, work, spinDown];

// Flatten all slides for sequencing
export const ALL_SLIDES: Slide[] = SCRIPT.flatMap((p) => p.slides);
