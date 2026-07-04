# Playtest Report

Method: 30-game randomized self-play soak (vitest, invariant-checked after
every action) plus reviewed full-game transcripts (`scripts/transcript.ts`)
across seeds and difficulties, plus 20 Playwright e2e scenarios on desktop
and mobile viewports.

## Bugs found and fixed

1. **Double coal-cost deduction on rail Network** — `applyNetworkSingle`
   subtracted market coal cost and `executeCoalPlan` deducted it again,
   driving the player's money negative. Found by the soak test's
   money-non-negative invariant (seed 30). Fixed.
2. **Automa logged non-VP merchant bonuses** — per the Mautoma FAQ the
   Automa only benefits from VP bonuses; the state was correct but the log
   claimed it gained income. Fixed (log suppressed).
3. **Lowercase city ids in flip logs** — cosmetic; now uses display names.

## Verified behaviors (transcript review)

- Era pacing: exactly 10 human turns per era (1 action on the game's first
  turn), matching the 2-player pacing the Mautoma is designed around.
- Automa first turn: both DRAW and DEVELOP rear-corner variants observed.
- Automa turns: never exceeds 2 actions; rail-era double links consume
  coal ×2 + beer, including opponent beer with connection; the
  Kidderminster–farm–Worcester 3-way link places and scores correctly.
- Sell logic: merchant beer consumed first; merchant VP bonuses granted,
  non-VP bonuses skipped; sells everything it can in one action.
- Market economics: iron works flip on build when the market absorbs all
  cubes; coal only auto-sells when connected to a merchant edge.
- Link scoring spot-checked against tile link-VP sums (e.g.
  Birmingham–Oxford = Birmingham tiles' icons + 2 for the merchant).
- Shortfall: forced tile sales at half cost, then VP penalty; pottery L2
  correctly refunds £0.

## Balance observations

- Automa final scores: ~105–200 VP depending on difficulty and how much
  the human contests the board — consistent with scores reported by
  physical Mautoma players.
- A passive/random human loses badly (0–63 VP), as expected; the Automa
  punishes uncontested link networks in the Rail Era.

## Known simplifications (v1)

- Resource-consumption ties (which coal mine/iron works/beer source) are
  auto-resolved by the engine: own tiles preferred, then a deterministic
  order. The full game lets the player choose; strategically this matters
  mainly for denying the opponent flips. Planned as a post-v1 chooser.
- The Gloucester "free develop" merchant bonus auto-picks the cheapest
  developable track rather than prompting.
- Shortfall tile sales auto-pick the cheapest tiles.
