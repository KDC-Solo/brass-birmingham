# Brass Birmingham Solo

Play **Brass: Birmingham solo in the browser** against the **Mautoma** — the
fan-made card-driven opponent by Mauro Gibertoni. The physical game has no
official solo mode; this app implements the full 2-player rules with the
Automa as your opponent, so nothing needs to be tracked by hand: legal moves,
resource sourcing, markets, income, era scoring and all 22 Automa cards are
automated.

**▶ Play it: https://kdc-solo.github.io/brass-birmingham-solo/**

| Desktop (light) | Desktop (dark) |
| --- | --- |
| ![Desktop light](docs/screenshots/desktop-light.png) | ![Desktop dark](docs/screenshots/desktop-dark.png) |

| Mobile | New game |
| --- | --- |
| ![Mobile dark](docs/screenshots/mobile-dark.png) | ![Setup](docs/screenshots/setup-light.png) |

## Features

- **Full rules engine** — build, network, sell, develop, loan, scout, pass;
  closest-coal-mine sourcing, market price tracks, overbuilding, farm
  breweries, the 3-way Kidderminster–farm–Worcester link, era transition,
  shortfall, link + industry scoring.
- **The complete Mautoma** — all 22 cards, three difficulty levels, every
  rulebook and FAQ tiebreaker implemented deterministically (link placement
  priorities, building-selection tiebreaker icons, beer order, first-turn
  rules).
- **Seeded games** — replay the exact same setup and Automa deck by reusing
  a seed.
- **Undo, autosave, game log** — the game survives page reloads; every
  engine event is logged.
- **Dark mode** — follows your system preference, toggleable, persistent.
- **Responsive** — plays on phone-sized screens; e2e-tested on desktop and
  mobile viewports.

## How to play

1. Pick a difficulty (easy / medium / hard — harder mats give the Automa
   better tiles) and start.
2. Each turn you take two actions (one on the very first turn): choose an
   action, then a card from your hand, then a target. Legal targets are
   highlighted on the board and listed as buttons.
3. The Automa takes its whole turn automatically after yours; read the log
   to see what it did.
4. Highest VP after the Rail Era wins.

Rules references: the official rulebook is available from
[Roxley](https://roxley.com/products/brass-birmingham) and the Mautoma
rulebook + FAQ from [mautoma.com](https://www.mautoma.com/brass-birmingham)
(rulebook PDFs are intentionally not redistributed in this repo).

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # engine unit tests + 30-game self-play soak
npx playwright test  # e2e, desktop + mobile projects
npm run build      # production build
```

- `src/engine/` — pure TypeScript rules engine (no UI dependencies), fully
  deterministic from a seed.
- `src/engine/mautoma/` — the Automa card data and turn executor.
- `src/ui/` — React UI: schematic SVG board, action flow, theming.
- `docs/DATA_SOURCES.md` — how the board/tile data was verified against
  three independent sources.
- `docs/PLAYTEST.md` — playtest report: bugs found, verified behaviors,
  known v1 simplifications.

## Credits & legal

- Brass: Birmingham is designed by Gavan Brown, Matt Tolman and Martin
  Wallace, published by [Roxley Games](https://roxley.com). This is an
  unofficial, non-commercial fan project: it uses **no publisher artwork or
  text** — the board is an original schematic. If you enjoy it, buy the
  physical game.
- The Mautoma solo variant is by **Mauro Gibertoni**
  ([mautoma.com](https://www.mautoma.com/brass-birmingham)) — thank you for
  making solo Brass possible.
- Game mechanics are not protected by copyright; all data files here were
  transcribed and cross-verified from publicly available sources
  (see `docs/DATA_SOURCES.md`).
