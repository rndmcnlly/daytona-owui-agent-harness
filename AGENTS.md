# Agent Instructions — lathe

This repo is a single-file Open WebUI toolkit (`lathe.py`) with a test harness (`test_harness.py`). Read both before making changes.

## Three audiences, three homes

This project has three distinct audiences. Each has a designated place for its documentation:

1. **Users** ("What is Lathe? What can it do?") — the docs site at [lathe.tools](https://lathe.tools) (`docs/`). The README should not try to be their entry point.
2. **OWUI admins** ("Should I install this? How?") — the `README.md`. This is the most important README audience. They need: what it does to their instance, security/trust model, requirements, installation, valve reference. Keep it focused and operational.
3. **Agents maintaining the project** — this file, `AGENTS.md`. Architecture, credentials, test procedures, contribution rules.

When writing or reorganizing documentation, route content to the right home. Implementation internals (how the onboard script works, output truncation design, browser-side JS mechanics) belong in `docs/` or in code comments — not in the README.

## Credentials and deployment

Deployment credentials live in `.env` (gitignored). It contains:

- `DAYTONA_API_KEY` — used by the test harness for integration tests against the live sandbox API.
- `CHAT_ADAMSMITH_AS_OWUI_TOKEN` — admin JWT for `https://chat.adamsmith.as`, the primary deployment. Use this to install or update the tool via the OWUI admin API.

To run unit tests (no sandbox needed):

```
uv run --script test_harness.py unit
```

To run all integration tests (requires `DAYTONA_API_KEY` in `.env`):

```
uv run --script test_harness.py
```

## Keep tests in sync with the implementation

`test_harness.py` tests internal helpers directly (imports them by name from `lathe`). When you:

- **Remove or rename a module-level name** — search the test harness for it and update accordingly.
- **Change a function signature** — find all call sites in the test harness and update them.
- **Delete a code path** — remove the tests that exercised it; dead tests are misleading.
- **Add a new helper or behavior** — add corresponding tests.

Run `uv run --script test_harness.py unit` before committing any change to `lathe.py`. All tests must pass.

## Closing issues

Do not close an issue (via commit message or `gh issue close`) without:

1. **Running the unit tests** and confirming they pass.
2. **Getting admin feedback from a real deployment** — install the updated `lathe.py` on `https://chat.adamsmith.as` using the admin token from `.env` and verify the behavior works end-to-end — unless the change clearly has no runtime impact (e.g. pure documentation, comment-only edits, test-only changes).

The unit tests catch regressions in pure-Python helpers but cannot catch broken HTTP paths, OWUI integration issues, or indentation bugs that only surface at runtime. Real deployment is the final gate.

## Architecture notes

- **Single file** — everything lives in `lathe.py`. Resist splitting it.
- **`_tool_context(emitter, fn)`** — the execution wrapper for all public tool methods except `destroy`. It opens a shared `httpx.AsyncClient`, calls `fn(client)`, and catches standard exceptions. Each tool defines `async def _run(client)` and passes it to `_tool_context`.
- **`destroy`** — intentional exception to the above: it manages its own client and error handling because it is destructive and does not use `_ensure_sandbox`.
- **`_ensure_sandbox(valves, email, client, emitter)`** — called at the top of every `_run(client)`. Transparent to the model; handles create/start/recover/poll.
- **Offload invariant** — binary and media files are always offloaded to OWUI storage via `_upload_to_owui_storage`. If that fails, the tool raises loudly. There is no silent inline fallback.
