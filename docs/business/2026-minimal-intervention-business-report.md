# Minimal-Intervention Business Research (2026)

Research report for a solo founder who wants a fully-digital, near-passive
business. Produced with the deep-research workflow (5 parallel source agents,
survivorship-bias-flagged) and then run through the LLM Council (architect,
pragmatist, skeptic, domain expert, chairman).

**Founder profile used:** solo, $500–$5k capital, fully-digital and
near-passive (a few hours/week), target $500–$2k/month profit, patient
(6–12 months, can extend). Region unspecified. Owns a built AI
trading-analysis web app.

---

## The decision (LLM Council verdict, confidence 8/10)

**Primary path:** Ship the existing trading app as a strictly **non-advisory,
bring-your-own-key (BYOK) self-directed trading research and journaling SaaS**
at ~$19/month, after compliance and security surgery. This reuses the asset you
already built, removes the legal landmine of giving individualized trading
advice, and fits a near-passive solo operator (BYOK means ~100% gross margin
and almost no per-user cost).

**Sequenced fallback:** If it plateaus near $500/month by month 6 in a crowded,
high-churn niche, pivot the **infrastructure** (dual-LLM client layer, pgvector
semantic search, encrypted per-user key storage, the React dashboard) into a
**GEO/AEO brand-visibility monitoring tool for SMBs** — a validated $29–$119/mo
market with structural demand and no financial-services regulation. The auth,
billing, and key-management hardening you do now transfers directly, so it is
not wasted work.

**Why not just sell the trading app as-is (the fast, tempting option):** the
liability is not in the marketing copy, it is in the code. The app emits
specific entry/exit/stop levels and relays buy/sell signals. Under the US
Investment Advisers Act and CFTC enforcement posture, charging for that is
acting as an unregistered investment adviser. A near-passive solo founder who
"does not want to monitor closely" is the worst-positioned defendant for an
enforcement action or a customer complaint. Two independent reviewers flagged
this at confidence 9, and the code confirmed them.

---

## Model comparison (2026 economics, with sources)

Honest headline: **none of these are truly passive**, and almost every
"passive income" figure online is survivorship bias. The realistic shape is
*semi-passive after months of active work*. The universal bottleneck is
**distribution/audience**.

### 1. Niche / programmatic SEO content sites (ads + affiliate)
- Needs roughly **50k sessions/month** to earn ~$1.25–2k at a $25–40 RPM. Ad
  networks loosened entry (Mediavine "Journey" from 1k sessions; Raptive from
  25k pageviews), but the revenue still scales with traffic you must earn.
- **Google's Helpful Content Update + AI Overviews cut click-through ~50–58%**;
  **32% of 671 studied travel publishers lost >90% of organic traffic** after
  HCU. Google actively deindexes scaled AI content. ~60% of programmatic SEO
  projects fail.
- Realistic timeline 12–24 months; for a brand-new site in 2026 this is a
  coin-flip-or-worse. Trading/finance content is YMYL, judged even harder.
- Verdict: **avoid** as a new build.

### 2. Micro-SaaS / AI-wrapper tools
- Median micro-SaaS earns **~$500/month**, but the median founder takes
  **12–18 months to reach $1k MRR** and **~70% never get there**.
- **3–8%/month churn** forces perpetual marketing just to hold revenue — the
  main reason it is not passive.
- AI wrappers specifically: **25–60% gross margins** (vs 70–90% normal SaaS),
  **80–95% fail in year one**, and platforms (OpenAI AgentKit, Custom GPTs)
  subsume thin wrappers. Capital fled thin wrappers in 2026.
- Verdict: viable only with a defensible niche/data/workflow, not a thin API relay.

### 3. Digital products / templates (Gumroad, Etsy)
- Winner-take-most: on Gumroad the **top 1% of products earn ~77% of revenue**;
  the **median product earns ~$364 over its entire lifetime**; only ~0.5–1%
  earn real money. Etsy median new seller ~$183/mo revenue, ~$37/mo profit.
- Verdict: possible with a portfolio + audience, but most land near $0.

### 4. Print-on-demand
- **10–30% margins**, ad-spend dependent, ~3 of 4 stores fail. The "$5 of ads →
  profit" era is over. Least passive, most cash-burning of the digital options.
- Verdict: avoid without a real design edge or existing audience.

### 5. Faceless / automated content (YouTube, short-form)
- **~97% of YouTube channels never reach monetization** (1k subs + 4k watch
  hours). YouTube's **July 2025 "inauthentic content" policy demonetizes
  mass-produced/AI-narration video channel-wide**; channels have been removed.
- Short-form pays weakly and directly (~$0.40–1.00 / 1k TikTok views; Reels has
  no reliable bonus; Pinterest pays creators $0). Best used as a funnel, not a
  revenue source. Single-platform-algorithm risk throughout.
- Verdict: avoid as standalone income.

### 6. Productized AI services / automation agency
- Hits $500–$2k/month with only **1–2 retainer clients** ($500–$1k each), no
  audience prerequisite, money comes from outreach (a learnable skill).
- But it is the **least passive** (10–25 hrs/week early, founder-bound sales),
  small agencies churn 25–32%/year, and the generic "AI automation agency"
  niche is saturated and hyped — survival needs a narrow vertical.
- Verdict: fastest to revenue, but conflicts directly with "near-passive."

### 7. Paid newsletter / community
- Newsletter needs ~**125–250 paid subs** (≈ **4–8k free subscribers** at 2–5%
  conversion); median creator earns **~$3–4k per year**. Gated by an audience
  you do not yet have.
- Community: **5–18%/month churn**, daily engagement work, least passive.
- Verdict: viable only as a distribution channel for another product, or if you
  already own an audience.

---

## Emerging 2026 gaps worth recording

Demand-backed, not speculative:

1. **EU AI Act Article 50 transparency / AI-governance tooling for SMB
   "deployers."** Hard deadline 2 Aug 2026 (with some 2026 Omnibus slippage on
   adjacent provisions), ~€52k/year compliance cost per high-risk system,
   compliance-automation market projected $20B → $72B. *Caveat:* enterprise
   buyers demand legal credibility a solo bootstrapper lacks — better as a
   later, niche micro-tool than a first product.
2. **Generative Engine Optimization (GEO/AEO) visibility tooling for SMBs.**
   Validated $29/mo price point (Otterly.ai), enterprises adopting while SMBs
   have not started — a genuine first-mover window. ~31% of the US population
   will use generative AI search in 2026. This is the council's recommended
   fallback because it reuses your infra and avoids regulation.
3. **Vertical AI for the accountant labor shortage.** ~340k US accountants lost
   in 5 years, ~75% of CPAs near retirement, forced AI adoption, funded
   comparables (Kobalt Labs $11M Series A). Regulated/trust-sensitive, but real.

---

## Reusing your trading platform: findings

The council audited the actual code. Two things matter.

**Regulatory exposure (the blocker).** The `market/analyze` endpoint returns
specific "Entry Opportunities" with entry/exit levels, strategies emit
stop-loss/take-profit instructions, and the TradingView webhook relays buy/sell
signals. That is individualized investment advice, outside the narrow
"impersonal publisher" safe harbor. 2026 SEC exam priorities explicitly target
AI trading tools and performance/backtest claims; the CFTC brands AI-bot return
promises as fraud. The codebase currently has **zero disclaimers**.

**Backtesting math bugs (sell fabricated numbers and you create fraud
exposure of a different kind).**
- Sharpe ratio annualizes with `sqrt(252)` regardless of candle timeframe,
  overstating Sharpe up to ~6x on hourly/crypto data (`backtesting.js`).
- Win rate is multiplied by 100 twice before being sent to the AI.
- Per-trade P&L percent divides by fixed initial capital, not current capital.
- No fees or slippage modeled — a 15% backtest can be net-negative live.
- Silent data bugs: Alpha Vantage "4h" actually returns 1h candles; CoinGecko
  volume hardcoded to 0; Binance silently truncates 6-month requests to ~20
  days; a cache key collides on Date objects.

**Security defects to fix before charging anyone** (you store users' exchange
and model API keys):
1. Sessions are in-memory and die on restart (`auth.js`) — move to Postgres/Redis.
2. `ENCRYPTION_KEY` silently derives from `DATABASE_URL` if unset — anyone with
   DB access can decrypt every user's keys. Require it explicitly; refuse to
   boot without it. **This is the worst single defect.**
3. No rate limiting on auth endpoints.
4. Cookies lack `secure`/`sameSite`; no CSRF protection.
5. TradingView webhook trusts a caller-supplied `userId` and uses a
   non-timing-safe secret compare.

---

## Roadmap (council's 30 / 60 / 90)

**Days 0–30 — make it legal and safe (no billing yet).**
- Remove the TradingView buy/sell webhook relay (do not "fix" it — remove it).
- Strip individualized entry/exit/stop/take-profit outputs from `market/analyze`
  and AI strategy responses. Reframe strategies as user-authored notes.
- Add a persistent "educational/research only, not investment advice, BYOK"
  disclaimer before every AI output and at signup. Write Terms of Service.
- Boot blockers: require explicit `ENCRYPTION_KEY`; move sessions to a
  persistent store.
- Strip false backtest metrics (Total Return, Sharpe, win rate) from the UI for
  v1; keep journaling, knowledge base, and general research chat.

**Days 30–60 — charge for the safe product.**
- Add Stripe, one tier at $19/month BYOK (a `plan` column + checkout route +
  webhook, under ~150 lines).
- Finish security hardening: rate limiting, `secure`/`sameSite` cookies, CSRF.
- Soft-launch to 1–2 ICT/SMC trading Discords as a journaling/research tool with
  a free trial.

**Days 60–90 — find the conversion.**
- Drive toward ~1,000 engaged users via community content. Measure against the
  ~3% conversion assumption (20–35 paying users ≈ $400–750/month).
- If stuck near $500/month with high churn by month 6, that is the trigger to
  start the GEO/AEO pivot on the now-hardened infrastructure.

**Standing compliance guardrails:** BYOK only, never custody keys, never
auto-execute, never use the words "signal," "recommendation," "guaranteed," or
specific return claims in product or marketing.

---

## Honest expectations

This path likely clears **$500/month, not $2k**, and only after reaching ~1,000
engaged users — months of community work in a crowded, high-churn niche. The
founder is patient, so that is acceptable, but it should be stated plainly. The
GEO/AEO fallback has a higher ceiling and a real moat (compounding optimization
data) but needs light client work to fund, which trades against "near-passive."

---

## Sources

SEO / content economics:
- https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/
- https://searchengineland.com/google-ai-overviews-hurt-click-through-rates-454428
- https://impact.com/commerce-content/googles-unhelpful-content-update/
- https://www.rankability.com/data/does-google-penalize-ai-content/
- https://thisweekinblogging.com/mediavine-raptive-requirements/
- https://thisweekinblogging.com/mediavine-vs-raptive/
- https://flippa.com/blog/business-valuation-multipliers-by-industry/

Micro-SaaS / AI wrappers:
- https://saasranger.com/blog/micro-saas-revenue-reality-what-1000-founders-actually-earn/
- https://superframeworks.com/articles/best-micro-saas-ideas-solopreneurs
- https://churnfree.com/blog/b2b-saas-churn-rate-benchmarks/
- https://www.softwareseni.com/why-ai-gross-margins-are-so-much-lower-than-saas-and-what-that-means-for-your-business/
- https://www.techtimes.com/articles/316961/20260521/ai-took-about-80-global-venture-funding-last-quarter-thin-wrapper-apps-were-not-winners.htm
- https://blog.acquire.com/acquire-com-biannual-acquisition-multiples-report-jan-2026/

Digital products / POD / content:
- https://lowcontentprofits.com/gumroad-digital-products-earnings/
- https://customcy.com/blog/how-much-do-etsy-sellers-make/
- https://www.printful.com/blog/what-is-a-good-profit-margin-for-print-on-demand
- https://fliki.ai/blog/youtube-monetization-policy-2025
- https://youtubeniches.com/blog/best-faceless-youtube-niches-2026
- https://rupa.pro/blog/how-much-does-tiktok-pay-per-view-in-2025-real-creator-data-calculator/

Productized services / newsletters / communities:
- https://agentincome.io/blog/ai-automation-agency-2026/
- https://focus-digital.co/average-marketing-agency-churn/
- https://www.reallygoodbusinessideas.com/p/substack-statistics
- https://circle.so/blog/community-pricing-strategy
- https://communipass.com/blog/skool-revenue-per-member-2026/

2026 gaps + trading-platform regulation:
- https://artificialintelligenceact.eu/transparency-rules-article-50/
- https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/
- https://www.tryprofound.com/blog/best-generative-engine-optimization-tools
- https://therecursive.com/vertical-ai-investment-why-specialized-ai-is-winning-in-2026/
- https://www.riacc.io/single-post/understanding-the-sec-newsletter-exemption-what-rias-need-to-know
- https://www.goodwinlaw.com/en/insights/publications/2025/12/alerts-privateequity-pif-2026-sec-exam-priorities-for-registered-investment-advisers
- https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/AITradingBots.html
- https://www.liberatedstocktrader.com/tradingview-review/

*Methodology caveat: several gap-market sizes and demand-density figures come
from vendor blogs or secondary sources and should be treated as directional.
Regulatory facts (SEC/CFTC, EU AI Act) and platform policy facts (Google,
YouTube, ad networks) are the most independently corroborated.*
