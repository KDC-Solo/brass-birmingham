# Brass Birmingham Solo

A personal, non-commercial digital implementation of the board game Brass:
Birmingham with the fan-made **Mautoma** solo opponent (by Mauro Gibertoni)
as the AI. Built so the game can be played solo — the physical game has no
official solo mode.

**Status: Phase 1 — rules engine.** See [FEASIBILITY.md](FEASIBILITY.md) for
the project plan and legal constraints.

## Architecture

- `src/engine/` — pure TypeScript rules engine, no UI dependencies.
  State + action → new state, fully unit-tested.
  - `data/` — board topology, industry tile tracks, card decks
    (provenance: `docs/DATA_SOURCES.md`)
  - `market.ts` — coal/iron market price logic
  - `income.ts` — progress/income track math
- `src/` — React UI (schematic board, no publisher artwork).

## Phases

1. Rules engine + tests, hot-seat play
2. Mautoma solo opponent (3 difficulty levels)
3. UI polish: map, undo, game log, score breakdown

## Commands

```sh
npm run dev    # start UI
npm test       # run engine tests
```

## Legal

Game mechanics are not copyrightable, but Brass: Birmingham's name, artwork,
and rulebook text belong to Roxley Games. This project is private and
non-commercial, uses no publisher assets, and is not distributed. The
Mautoma solo variant is fan-made by Mauro Gibertoni.
