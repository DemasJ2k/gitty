# LLM Council

A decision-making tool for this repo, inspired by Andrej Karpathy's
[llm-council](https://github.com/karpathy/llm-council). When a choice is hard
to reverse or spans the whole system, you get a debated, synthesized answer
instead of a single opinion.

## How it works

Three stages, the same shape as Karpathy's app:

1. **Independent opinions.** Four role-based members answer the question on
   their own, in parallel: Architect, Pragmatist, Skeptic, and Domain expert.
2. **Anonymized cross-review.** Each member reads the others' answers with the
   authors hidden, ranks them, and revises if convinced. Hiding authorship
   stops deference to a "senior" voice.
3. **Chairman synthesis.** The Chairman weighs everything and issues one
   decision with reasoning, recorded dissent, next steps, and a confidence
   score.

## How to use it

Ask Claude to "convene the council" (or invoke the `llm-council` skill) on a
specific question. Good prompts name the decision and the constraints:

> Convene the council: should backtesting run inline in `routes.js` or move to
> a job queue? Constraint: single Node process, Postgres available.

The members are read-only analysts — they investigate the code but never edit
it. Only the main agent applies the resulting decision.

## When to use it (and when not to)

Use it for: architecture, schema changes, risky refactors, financial-logic
correctness, and reviewing important diffs.

Skip it for: one-line fixes, obvious bugs, and mechanical edits. The council
spends time and tokens; reserve it for decisions that earn the cost.

## Claude-only vs multi-vendor

Out of the box the council runs entirely on Claude subagents — no extra API
key, works immediately. To debate across vendors (GPT + Gemini + Claude) like
the original app, add an `OPENROUTER_API_KEY` and map members to models in
`.claude/skills/llm-council/council.config.json`. See the skill file for the
exact steps.

## Files

- `.claude/skills/llm-council/SKILL.md` — the protocol Claude follows.
- `.claude/skills/llm-council/council.config.json` — multi-vendor model map.
- `.claude/agents/council-*.md` — the member and chairman definitions.
