# Lathe Explainer — Revised Script

Target: ~2 minutes with voiceover. Three acts tracking a single session.

Narrative agenda: **spin up, get to work, spin down.** Lathe is an agent
harness for Open WebUI — inspired by CLI coding agents like Pi and OpenCode,
but purpose-built for the browser. The interesting thing isn't that the tools
exist (everyone expects tool use by now). The interesting thing is the
lifecycle: a sandbox materializes when the model needs it, the agent works
inside it, and it sleeps automatically when you're done. Projects persist
across conversations.

---

## Act 1: Spin Up

The sandbox appears. No install wizard, no "create environment" button. The
user just starts talking and the infrastructure shows up.

### Slide: title

**[Title slide]**
Lathe — an agent harness for Open WebUI

**Narration:**
"Lathe is an agent harness for Open WebUI. Inspired by coding agents like Pi
and OpenCode — but built for the browser."

### Slide: the-landscape

**[Text]**

**Narration:**
"Terminal coding agents are everywhere now. They're fast, capable, and deeply
integrated with developer workflows. But they assume you're sitting at a
workstation with a shell. Lathe brings that same agent surface to Open WebUI —
any model, any browser, no local setup."

### Slide: first-message

**[Chat]** User: "I have a project repo I need to work on. Can you clone it
and get oriented?"

**Narration:**
"A user opens their browser and starts a conversation. Nothing special yet —
just a chat window. But the moment the model reaches for a tool, something
happens."

### Slide: sandbox-spins-up

**[Code block]** Shows sandbox creation — the status indicator, the VM
starting, toolbox becoming responsive.

**Narration:**
"A sandbox spins up. A full Linux VM, provisioned on demand, dedicated to this
user. The model didn't ask for it. The user didn't configure it. Lathe handled
the lifecycle transparently — create, start, wait for ready."

### Slide: arch-overview

**[Architecture diagram]** User → Open WebUI → Lathe → Daytona Sandbox

**Narration:**
"The architecture is simple. The user talks to a model in Open WebUI. The
model calls Lathe's tools. Each tool executes in a Daytona sandbox. Results
flow back as tool output the model reasons about."

---

## Act 2: Get to Work

The agent is productive. It clones, reads, builds, exposes. The key beats:
the agent handles files and commands (implied, not enumerated), and then
expose() takes the interaction beyond the chat window.

### Slide: clones-repo

**[Tool call]** bash: git clone, ls showing project structure

**Narration:**
"The agent clones the repo and explores the project structure. Shell commands,
file reads, edits — the full surface of a coding agent, running in the
sandbox."

### Slide: onboards

**[Tool call]** onboard(): loads AGENTS.md, project conventions, context

**Narration:**
"Then it calls onboard. This loads project-specific instructions, conventions,
and context — all in one shot. The agent picks up the project's norms the same
way a new teammate would read the contributing guide."

### Slide: builds-something

**[Code block]** Agent writing code, installing deps, running a dev server

**Narration:**
"The agent gets to work. It writes code, installs dependencies, starts a dev
server. Each step is a tool call — visible in the conversation as it happens.
The sandbox is a persistent machine, so packages stay installed across
conversations."

### Slide: expose-moment

**[Tool call]** expose(port=8080) → public URL

**Narration:**
"Now here's where it gets interesting. The agent calls expose — and the user
gets a public URL to whatever's running in the sandbox. A web app, a file
browser, a full VS Code instance. The interaction breaks out of the chat
window."

### Slide: beyond-chat

**[Scene split]** Left: VS Code in browser. Right: agent still working in chat.

**Narration:**
"The user opens VS Code in one tab and the running app in another. They edit
code directly while the agent makes structural changes through chat. Both work
on the same filesystem, in the same sandbox, at the same time."

---

## Act 3: Spin Down

The session ends. The sandbox doesn't die — it sleeps. Projects persist.
Coming back is seamless.

### Slide: session-ends

**[Chat]** User: "That's good for today." Agent: "Your sandbox will sleep
automatically when idle. Everything will be here next time."

**Narration:**
"When the user is done, they just close the tab. The sandbox idles for a few
minutes, then sleeps on its own. No teardown, no save button."

### Slide: comes-back

**[Chat]** New conversation. User: "Let's pick up where we left off." Agent
calls onboard() — project files, installed packages, running configs all still
there.

**Narration:**
"Days later, the user starts a new conversation. The sandbox wakes
transparently on the first tool call. Files, packages, git history — all still
there. The agent calls onboard and picks up the project context immediately."

### Slide: the-cycle

**[Diagram/callout]** Spin up → Work → Spin down → (repeat)

**Narration:**
"That's the cycle. Spin up, get to work, spin down. The sandbox is
infrastructure that appears when you need it and disappears when you don't.
One toolkit. One API key. Every model on the server gets a coding agent
surface."

### Slide: outro

**[Title slide]**
lathe.tools — github.com/rndmcnlly/lathe

**Narration:**
"Lathe. An agent harness for Open WebUI."
