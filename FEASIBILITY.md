# Feasibility Study: Brass Birmingham Solo App

*Date: 2026-07-04*

## Verdict

**Feasible and worth doing — for personal use.** You're in the unusual position where building it yourself is genuinely the most practical way to play the game solo, not just a fun side project. The main risk is not technical difficulty but scope creep; the main hard constraint is that you cannot publish it commercially or with Roxley's assets.

## Why the timing actually favors this

The digital landscape for Brass Birmingham is currently a gap:

1. **The official digital version is gone.** The Steam adaptation was delisted in May 2024 due to licensing changes. You can no longer buy it.
2. **The Board Game Arena version isn't out.** Roxley's official BGA implementations of Lancashire and Birmingham have been in *private alpha* since mid-2025, queued behind Brass: Pittsburgh, with no committed date. Crucially, BGA is a multiplayer platform — even when it ships, a solo-vs-bot mode is unlikely.
3. **The best existing fan solo tool requires the physical game.** Tony Alicea's "Eliza" (gameswithtony.com/eliza) is a companion app that drives two bot opponents — but you play on a physical board it assumes you own. Since you don't own the game, it doesn't solve your problem.
4. **The game has no official solo mode**, so buying the physical copy wouldn't fix it either — you'd still be relying on fan automas like the Mautoma.

So for "play Brass Birmingham solo, today, without owning it," a self-built app is essentially the only complete path.

## Technical feasibility

### The rules engine (moderate, well-bounded)

Brass Birmingham is complex but *deterministic and fully specified* — no hidden simultaneous decisions, no physical dexterity, no fuzzy rules. The hard parts are edge cases, all documented in the rulebook and reference sheets already in `docs/`:

- Board as a graph: ~30 locations, canal/rail links, network connectivity queries
- Resource logic: coal (needs connection), iron (no connection needed), beer (own vs. opponent vs. merchant), market price tracks with buy/sell
- Actions: Build (with overbuild rules), Network, Develop, Sell, Loan, Scout, Pass
- Two eras with the tile-clearing transition, income track, VP scoring for links + flipped industries

Ballpark: a clean TypeScript engine is roughly 3–5k lines plus tests. With Claude Code assistance, a correct hot-seat engine is a few weekends of work, not months. The engine should be a pure state machine (state + action → new state) with seeded RNG — that makes rules testable in isolation and the UI a thin layer on top.

### The solo opponent (easy — this is the pleasant surprise)

The **Mautoma** (fan automa by Mauro Gibertoni, v1.1 + FAQ in `docs/`) is almost designed to be digitized:

- 22 double-sided cards driving one or two actions per turn — pure card-draw + priority lookup
- The Automa uses no money, never Loans or Scouts, and every ambiguity is resolved by explicit written tiebreakers (link placement priority list, building selection priority list)
- Three difficulty levels = three starting tile layouts

There is **no AI to write**. It's a rules interpreter, maybe 500–1000 lines. This removes what would otherwise be the killer feature-cost of a solo app (a real Brass AI via MCTS would be a research project — avoid it).

### The UI (the real time sink)

Rendering the board is where projects like this die. Recommendations:

- Web app (browser, no app store, runs anywhere)
- **Schematic map** — nodes and edges, not a reproduction of the board art. This is both far less work and legally necessary (see below)
- Click-to-act with legal-move highlighting from the engine; no drag-and-drop physics

## Legal reality

- **Rules and mechanics are not copyrightable.** Implementing the game logic is fine.
- **Artwork, map art, rulebook text, card graphics, logo, and the "Brass: Birmingham" trademark are protected.** Roxley actively manages digital rights (they pulled the Steam app; they license BGA), so they clearly care about this space.
- **Personal, private use: effectively zero risk.** Build it, play it.
- **Public distribution is where it gets risky.** Do not put it on an app store, do not use Roxley's art or name in anything public. If you ever want to share: publish the engine code only (original schematic assets, no rulebook text, generic naming), and as a courtesy contact Mauro Gibertoni (email is in the Mautoma PDF) about the automa design. Anything beyond that needs Roxley's blessing.

## Benefit or hindrance?

**Benefit, if scoped in phases:**

| Phase | Deliverable | Notes |
|---|---|---|
| 1 | Rules engine + tests, minimal text/schematic UI, hot-seat 2p | Proves the hard part; already playable for learning the game |
| 2 | Mautoma opponent (3 difficulties) | The actual goal — solo play |
| 3 | UI polish: nicer map, undo, game log, score breakdown | Optional, incremental |

**Hindrance, if you attempt:** custom smart AI, online multiplayer, mobile app stores, faithful board-art reproduction, or Lancashire support before Birmingham works. Each of those multiplies the project without serving the goal ("I want to play solo").

**Cheaper alternatives, for honesty's sake:** Tabletop Simulator / Tabletopia mods exist and could host a manual Mautoma game today for ~$0–20 — but you'd be pushing every rule by hand with no enforcement, which for a game this fiddly is most of the pain. And you could simply wait for BGA — but that's an unknown date and probably multiplayer-only.

## Recommendation

Build it. Web app, TypeScript, pure-function rules engine with a full test suite driven by the reference sheets in `docs/`, Mautoma as the opponent, schematic board. Keep it private. Phase 1 first — if the engine stalls, you've lost a weekend, not a year.
