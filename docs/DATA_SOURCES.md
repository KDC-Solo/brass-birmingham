# Board & Tile Data Provenance

Game data in `src/engine/data/` was encoded by cross-checking three
independent sources against each other and against the rulebook PDFs in
this folder. Where sources disagreed, the rulebook and money-equilibrium
arguments decided.

## Sources

1. **Rulebook + fan reference sheets** (this `docs/` folder) — rules text,
   setup counts, era restrictions.
2. **ikegami/tts_brass** (Tabletop Simulator mod built from game assets) —
   link graph (39 links incl. canal/rail flags and the 3-way
   Kidderminster–farm–Worcester link), slot counts per city, market sizes,
   merchant slot layout. Treated as authoritative for topology.
3. **npow/brass-birmingham** — slot industry types, card deck distribution,
   merchant bonuses.
4. **jgilles23/brass** (`industry_data.csv`) — full industry tile stats.

## Agreements

- Link graph: sources 2 and 3 agree exactly (39 links; Burton–Walsall the
  only canal-only link; 8 rail-only links).
- Industry tile stats: sources 3 and 4 agree on every tile; source 4 adds
  era-dependent brewery production (1 barrel canal / 2 rail), confirmed by
  the rulebook.
- Card decks: source 3's counts sum to exactly 40/54/64 cards for 2/3/4
  players, matching the published deck sizes.

## Corrections made to source data

- **Market prices** (npow had wrong tails): coal is 14 spaces at
  £1–£7 ×2, £8 when empty; iron is 10 spaces at £1–£5 ×2, £6 when empty.
  Confirmed by rulebook setup ("leave 1 of the £1 coal spaces / both £1
  iron spaces open") and by buy/sell price symmetry.
- **Starting money** (npow had per-player-count values): all players start
  with £17 and income level 0 (space 10), per the rulebook.
- **Brewery production** modeled as era-of-build dependent, not per-level.

## Still to verify by eye against the rulebook map

- Slot industry types for less-visited cities (Leek, Uttoxeter, Stone) —
  only npow attests these at type level (TTS confirms counts only).
