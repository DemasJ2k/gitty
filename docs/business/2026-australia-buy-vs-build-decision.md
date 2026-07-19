# Australia: Buy vs Build Decision (reliable income fast)

Follow-up to the [2026 minimal-intervention report](./2026-minimal-intervention-business-report.md),
re-scoped to the founder's updated priorities and confirmed location.

**Updated inputs:** solo founder in **Australia**; **reliable income as fast as
possible** now outranks full passivity; budget $500–$5k USD (~A$800–7,700);
target $500–$2k/month. Question: **buy an existing business or build one?**

Produced by 3 deep-research agents (buy side, build side, Australia legal/tax +
ASIC) and a full LLM Council pass (architect, pragmatist, skeptic, domain,
chairman). All four members agreed on direction; chairman confidence 8/10.

---

## Decision

**Build a single-vertical GEO/AEO + Google Business Profile retainer service
for Australian SMBs, delivered manually, priced from A$1,500/month, sold cold
starting now. Buy nothing. Keep the trading app out of the income plan.**

One retainer client clears the whole target. The service converts in **weeks,
not months**, its failure mode is bounded and legal, and it needs no software
built up front.

---

## Why not buy

At $500–$5k, buying is the wrong tool for "fast reliable income":

- It buys only **~$50–$170/month** (a small content site or newsletter at
  2.5–3x annual profit), with a **~30–36 month payback**.
- Marketplaces **don't verify revenue or traffic below $50k** (Flippa), so
  **fraud concentrates in exactly this price band** — faked earnings
  screenshots, bot traffic. Solo due diligence can't affordably catch it.
- Content sites carry a **Google kill switch** (the Dec 2025 core update hit
  ~71% of affiliate sites). Dropshipping ~90% fail year one. Buying social
  accounts violates platform ToS (instant-ban risk).

Buying is unverifiable, irreversible, and slow. Reject it at this budget.

## Why not the trading app (for this goal)

Its only legal lane in Australia — journal, backtesting on user-supplied rules,
factual education — is exactly the **slow-to-monetize** lane you're avoiding
(15–100+ subscribers at $19–39/mo over months, versus one SMB client in weeks).

And under Australian law the fast version is a **trap, not a shortcut**. There
is no US-style publisher exemption here. Relaying signals, recommending specific
securities, or letting an AI voice opinions on a specific financial product is
unlicensed financial advice under Corporations Act s766B/s911A: **criminal
exposure up to 5 years plus civil penalties**, with a direct precedent (ASX Wolf
/ Tyson Scholz: permanent injunction, A$456k costs, bankruptcy) and an active
2026 ASIC finfluencer crackdown.

**Live exposure to contain now (regardless of direction):** the app already
emits AI "strategy/optimization" output, and `/chat` (`server/routes.js:359`)
has no system prompt and no disclaimer, so it can voice buy/sell opinions on
specific securities. If the app is reachable by anyone but you, add a disclaimer
+ chat guardrail or take it offline. If it's private, confirm that and leave it.

## Why the service wins

- **Speed:** one client at A$1,500–2,500/month hits target in an evidence-backed
  **2–6 week** window (cold outreach converts ~1 client per 50–100 targeted
  contacts with 3–7 follow-ups).
- **Bounded, reversible risk:** if it doesn't work, the sunk cost is weeks of
  time, not capital or a codebase. It's cleanly decoupled from everything else.
- **Legal by construction:** selling marketing/visibility services to SMBs sits
  nowhere near financial-services regulation.
- **Low overhead:** off-the-shelf tools under A$100/month; no software to build.

---

## Australia setup (nearly free, do first)

- **ABN** as a **sole trader** — free, online, fast. No company needed yet.
- **No GST** registration required under **A$75,000** turnover — skip it for now.
- **Stripe** set to **AUD** for invoicing and cards. Digital exports overseas
  are GST-free if you later sell abroad.
- Declare business income from the first dollar. That's the whole footprint.
- Incorporate (Pty Ltd, ~A$611 setup + A$329/yr) only later, when liability or
  income makes it worth it.

## First 14 days

1. ABN + Stripe (AUD) live.
2. Lock **one** vertical (dental/allied health, boutique law, or trades).
3. Build a **100–150** prospect list in that vertical (Google Maps + ABN lookup).
4. Build **one reusable "AI visibility audit"** you run per prospect — "does this
   business show up when I ask ChatGPT/Gemini/Perplexity for the best X in
   [suburb]?" plus Google Business Profile gaps. This is your outreach hook.
5. Start cold outreach (email + phone/LinkedIn) with a **3–7 touch** follow-up
   sequence, each personalized with that prospect's one-line audit finding.
6. Offer **2–3 price tiers** (tiering roughly doubles close rate; anchors the
   middle). Example: A$1,500/mo base, A$2,500/mo with content.

## 30 / 60 / 90

- **Day 30:** client one signed.
- **Day 60:** client two (referral + continued outreach) for buffer against
  ~25%/yr retainer churn.
- **Day 90:** grow or hold. Only after **3+ clients and observed repetition** do
  you consider productizing into software.

## Non-negotiable sales guardrails (the load-bearing part)

The real failure mode for a technical founder is **building instead of selling**
— it feels productive while producing no pipeline.

- **Pre-commit a weekly outbound quota** (calls/DMs/emails) and hit it *before*
  you're allowed to build or polish anything.
- **Hold firm minimum pricing** — do not discount to A$500 to close a nervous
  first deal. A$1,500 floor.
- **Written scope boundary** per client, so a retainer can't silently become
  unpaid full-service work.
- **Two-week pipeline checkpoint.** Zero *revenue* at week two is normal; zero
  *conversations* is the real failure signal.

## The service → SaaS arc (later, not now)

If the manual service reveals a repeatable workflow across 3+ clients, that's
the trigger to productize into a GEO-tracking SaaS — reusing the app's **RAG +
encrypted-BYOK pattern** (`server/vectorService.js`), *not* its trading-coupled
schema or in-memory auth, which aren't SaaS-grade. Building the SaaS before
paying clients validate the workflow inverts the whole speed advantage.

## Honest main risk

This plan asks a technical founder to sell — cold, to strangers, holding price —
before building anything. The tools and legality are not the hard part. Choosing
to make the next ten calls instead of "improving the audit tool" is. The quota
and the two-week checkpoint exist because of this.

---

## Sources

Buy side: Flippa/Motion Invest/Tiny Acquisitions/Empire Flippers/Acquire.com
pricing and verification policies; content-site and newsletter valuation
multiples; Google Dec 2025 core update impact; due-diligence/fraud guidance.
Build side: productized-service and GEO/AEO pricing (AU), cold-outreach
conversion, micro-SaaS timelines, retainer churn. Australia: ATO (GST $75k
threshold, exports), business.gov.au (structures, ABN), ASIC (s766B/s911A,
RG 234/244, ASX Wolf 22-371MR, 2026 finfluencer crackdown 26-081MR, REP 798),
Stripe AU. Full URLs are in the research agents' transcripts; regulator and
platform-policy facts are the most independently corroborated. Market-size and
demand-density figures from vendor blogs are directional.

*This is research and general information, not legal, financial, or tax advice.
Confirm ABN/GST/structure with an Australian accountant and any trading-product
questions with an Australian financial-services lawyer before acting.*
