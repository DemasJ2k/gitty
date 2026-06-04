# .claude/ — agent workspace setup

This folder configures how AI agents (Claude Code) work in this repo. It exists
to keep sessions fast, consistent, and free of repeated setup friction.

## What's here

- **settings.json** — shared project settings:
  - a permission allowlist for safe, common commands (npm, git, drizzle, node
    tests) so routine work doesn't trigger a prompt every time;
  - a `SessionStart` hook that auto-installs dependencies on a fresh clone;
  - a deny rule so agents can't read `.env`.
- **hooks/ensure-deps.sh** — runs at session start. Installs `node_modules` if
  missing and reminds you to create `.env`. Idempotent and quiet.
- **skills/** — capabilities Claude can invoke:
  - `llm-council/` — multi-perspective decision council (see `docs/llm-council.md`).
  - `stop-slop/` — removes AI writing tells from prose (vendored, MIT).
- **agents/** — the council members (`council-architect`, `council-pragmatist`,
  `council-skeptic`, `council-domain`, `council-chairman`).

## Project memory

The authoritative project context lives in `/CLAUDE.md` at the repo root, which
Claude Code loads automatically every session. Update it when the stack,
commands, or conventions change so context never drifts.

## Local overrides

Put machine-specific settings in `.claude/settings.local.json` — it is
gitignored and won't be shared.
