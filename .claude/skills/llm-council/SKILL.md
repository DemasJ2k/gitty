---
name: llm-council
description: Convene a multi-perspective council for hard or high-stakes decisions — architecture choices, risky refactors, ambiguous trade-offs, financial-logic correctness, and serious code review. Fans the question out to role-based subagents, has them critique each other anonymously, then a chairman synthesizes one decision. Use when a single opinion is not enough and the cost of getting it wrong is high.
metadata:
  trigger: Hard architecture/design decisions, irreversible or wide-reaching changes, conflicting trade-offs, reviewing important diffs, validating trading/financial logic.
  inspired_by: Andrej Karpathy's llm-council (anonymized peer review + chairman synthesis)
---

# LLM Council

Get more than one opinion before committing to a decision that is hard to
reverse or spans the whole system. Modeled on Karpathy's llm-council: every
member answers independently, members critique each other's answers without
knowing who wrote what, and a chairman compiles one final decision.

## When to convene

Convene the council for:
- Architecture and design choices (new service, schema change, data flow).
- Refactors that touch many files or are hard to undo.
- Trade-offs with no obvious winner (library A vs B, sync vs async, build vs buy).
- Correctness of trading/financial logic (backtesting math, P&L, risk sizing,
  order handling) where a subtle bug costs real money.
- Reviewing an important diff before it ships.

Skip it for a one-line fix, an obvious bug, or a mechanical change. The council
costs time and tokens — spend them only when the decision earns it.

## The members

Defined in `.claude/agents/`:

| Member | Lens |
|--------|------|
| `council-architect` | Long-term design, maintainability, system fit |
| `council-pragmatist` | Ship it: simplicity, YAGNI, smallest change that works |
| `council-skeptic` | Failure modes, edge cases, security, what breaks |
| `council-domain` | Trading/fintech correctness: data integrity, financial math, risk |
| `council-chairman` | Weighs all opinions and decides |

## Protocol

Run these three stages. Use the Agent tool to dispatch members; send the
independent members **in parallel** (multiple Agent calls in one message).

### Stage 1 — Independent opinions
Dispatch the question, plus the relevant files/context, to `council-architect`,
`council-pragmatist`, `council-skeptic`, and `council-domain` at the same time.
Ask each for: a recommendation, the reasoning, key risks, and a confidence
score (0–10). They work independently and do not see each other's answers.

### Stage 2 — Anonymized cross-review
Collect the four opinions. Strip the author names and label them "Opinion A/B/
C/D". Send the full anonymized set back to the same members and ask each to:
rank the opinions, name the strongest argument and the biggest flaw they see,
and revise their own recommendation if another opinion changed their mind.
Anonymity stops members from deferring to a "senior" voice.

### Stage 3 — Chairman synthesis
Pass every opinion and review to `council-chairman`. It produces ONE decision:
the recommendation, why it beat the alternatives, the dissent worth recording,
concrete next steps, and a confidence score. Relay the chairman's verdict to
the user — that is the deliverable.

A lightweight quorum (skip Stage 2) is fine for medium-stakes calls: get the
four opinions, then have the chairman synthesize directly.

## Multi-vendor mode (optional, OpenRouter)

By default the council runs entirely on Claude subagents — no extra key, no
cost beyond the session. To get true cross-vendor debate (GPT + Gemini +
Claude, the way Karpathy's app works):

1. Add `OPENROUTER_API_KEY` to `.env` (it is already stubbed in `.env.example`).
2. Edit `.claude/skills/llm-council/council.config.json` to map each member to
   a vendor model.
3. Have the relevant member subagents call OpenRouter
   (`https://openrouter.ai/api/v1/chat/completions`) instead of answering
   directly, then run the same three-stage protocol.

Until a key is present, treat `council.config.json` as documentation of intent
and run Claude-only.

## Output contract

End every council run with a short, slop-free summary (apply the `stop-slop`
skill):

```
DECISION: <one sentence>
WHY: <2–4 lines>
DISSENT: <the strongest opposing view, or "none material">
NEXT: <concrete steps>
CONFIDENCE: <n/10>
```
