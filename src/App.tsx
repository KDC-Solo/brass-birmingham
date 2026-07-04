import { useState } from 'react';
import './ui/theme.css';
import { AUTOMA, HUMAN, type GameState } from './engine/state';
import { levelForSpace } from './engine/income';
import { COAL_MARKET, IRON_MARKET, nextBuyPrice } from './engine/market';
import { CITIES } from './engine/data/board';
import type { MautomaDifficulty } from './engine/mautoma/cards';
import { BoardMap } from './ui/BoardMap';
import { cardLabel, useActionFlow } from './ui/ActionPanel';
import { useGame, useTheme } from './ui/useGame';
import { HelpButton } from './ui/Help';

export default function App() {
  const game = useGame();
  const { theme, toggle } = useTheme();

  return (
    <div className="app">
      <div className="topbar">
        <h1>Brass Birmingham Solo</h1>
        {game.state && (
          <span className="stat" data-testid="era-turn">
            {game.state.era === 'canal' ? 'Canal' : 'Rail'} Era — Turn {game.state.turn} — {game.state.actionsLeft}{' '}
            action{game.state.actionsLeft === 1 ? '' : 's'} left
          </span>
        )}
        <div className="spacer" />
        {game.state && (
          <>
            <button onClick={game.undo} disabled={!game.canUndo} data-testid="undo">
              ⎌ Undo
            </button>
            <button onClick={game.reset} data-testid="new-game">
              New game
            </button>
          </>
        )}
        <HelpButton />
        <button onClick={toggle} data-testid="theme-toggle" aria-label="Toggle dark mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      {game.state ? <GameScreen state={game.state} dispatch={game.dispatch} /> : <SetupScreen onStart={game.start} />}
    </div>
  );
}

function SetupScreen({ onStart }: { onStart: (seed: number, difficulty: MautomaDifficulty) => void }) {
  const [difficulty, setDifficulty] = useState<MautomaDifficulty>('easy');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));

  return (
    <div className="setup panel" data-testid="setup">
      <h2 style={{ margin: 0 }}>New solo game</h2>
      <p style={{ margin: 0, color: 'var(--muted)' }}>
        You play the standard rules against the Mautoma, a card-driven opponent (fan solo variant by Mauro Gibertoni).
      </p>
      <label>
        Difficulty
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as MautomaDifficulty)} data-testid="difficulty">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <label>
        Seed
        <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} data-testid="seed" />
      </label>
      <button className="primary" onClick={() => onStart(seed, difficulty)} data-testid="start-game">
        Start game
      </button>
    </div>
  );
}

function GameScreen({ state, dispatch }: { state: GameState; dispatch: (a: never) => string | null }) {
  const flow = useActionFlow(state, dispatch as never);
  const human = state.players[HUMAN];
  const automa = state.players[AUTOMA];

  return (
    <>
      <div className="game-layout">
        <div className="board-wrap">
          <BoardMap
            state={state}
            highlightCities={flow.highlightCities}
            highlightLinks={flow.highlightLinks}
            onCityClick={(city) => {
              const choice = flow.builds.find((b) => b.option.city === city);
              if (choice) flow.chooseBuild(choice);
            }}
            onLinkClick={(linkId) => {
              const choice = flow.networks.find((n) => n.option.linkIds[0] === linkId);
              if (choice) flow.chooseNetwork(choice);
            }}
          />
        </div>

        <div className="side">
          <div className="panel" data-testid="player-panel">
            <h3>
              <span className="badge-human">You</span> · £{human.money} · income {levelForSpace(human.incomeSpace)} · {human.vp} VP
            </h3>
            <div className="stat-row">
              <span className="stat">
                Draw pile <b data-testid="draw-pile">{state.drawPile.length}</b>
              </span>
              <span className="stat">
                <span className="badge-automa">Automa</span> <b data-testid="automa-vp">{automa.vp} VP</b>
              </span>
              <span className="stat">
                Automa deck <b>{state.automaDeck.length}</b>
              </span>
            </div>
          </div>

          <div className="panel">
            <h3>Markets</h3>
            <div className="stat-row">
              <span className="stat" data-testid="coal-market">
                ⚫ Coal £<b>{nextBuyPrice(COAL_MARKET, state.coalCubes)}</b> ({state.coalCubes})
              </span>
              <span className="stat" data-testid="iron-market">
                🔩 Iron £<b>{nextBuyPrice(IRON_MARKET, state.ironCubes)}</b> ({state.ironCubes})
              </span>
            </div>
          </div>

          <div className="panel" data-testid="action-panel">
            <h3>Actions</h3>
            <div className="actions">
              {(['build', 'network', 'sell', 'develop', 'loan', 'scout', 'pass'] as const).map((a) => (
                <button
                  key={a}
                  data-testid={`action-${a}`}
                  disabled={!flow.availability[a] || state.gameOver}
                  className={flow.flow.action === a ? 'selected' : ''}
                  onClick={() => flow.chooseAction(a)}
                >
                  {a[0].toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>

            {flow.flow.action && (
              <p style={{ margin: '8px 0 4px', fontSize: 13, color: 'var(--muted)' }} data-testid="flow-hint">
                {flow.flow.cardIdx === null
                  ? flow.flow.action === 'scout'
                    ? 'Pick the action card, then 2 more to discard.'
                    : `Pick a card to ${flow.flow.action}.`
                  : flowHint(flow.flow.action)}
                <button style={{ marginLeft: 8, fontSize: 12, padding: '2px 8px' }} onClick={flow.reset} data-testid="flow-cancel">
                  cancel
                </button>
              </p>
            )}
            {flow.error && (
              <p style={{ color: 'var(--danger)', fontSize: 13 }} data-testid="flow-error">
                {flow.error}
              </p>
            )}

            <h3 style={{ marginTop: 10 }}>Hand</h3>
            <div className="hand" data-testid="hand">
              {human.hand.map((card, i) => (
                <span
                  key={i}
                  className={[
                    'card-chip',
                    card.kind.startsWith('wild') ? 'wild' : '',
                    flow.flow.cardIdx === i || flow.flow.scoutExtras.includes(i) ? 'selected' : '',
                  ].join(' ')}
                  style={{ opacity: flow.flow.action && !flow.cardsSelectable.has(i) ? 0.4 : 1 }}
                  data-testid={`hand-card-${i}`}
                  onClick={() => flow.cardsSelectable.has(i) && flow.chooseCard(i)}
                >
                  {cardLabel(card)}
                </span>
              ))}
            </div>

            {flow.flow.action === 'build' && flow.flow.cardIdx !== null && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="build-options">
                {flow.builds.map((b, i) => (
                  <button key={i} onClick={() => flow.chooseBuild(b)}>
                    {CITIES[b.option.city].name}: {b.option.industry} L{b.option.level} — £{b.option.totalCost}
                    {b.option.overbuild ? ' (overbuild)' : ''}
                  </button>
                ))}
                {flow.builds.length === 0 && <span style={{ color: 'var(--muted)' }}>No legal builds with this card.</span>}
              </div>
            )}

            {flow.flow.action === 'network' && flow.flow.cardIdx !== null && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="network-options">
                {flow.networks.map((n, i) => (
                  <button key={i} onClick={() => flow.chooseNetwork(n)}>
                    {n.option.linkIds[0]} — £{n.option.totalCost}
                  </button>
                ))}
              </div>
            )}

            {flow.flow.action === 'sell' && flow.flow.cardIdx !== null && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="sell-options">
                {flow.sells.map((s, i) => {
                  const selected = flow.flow.sales.some((x) => x.sale.city === s.sale.city && x.sale.slot === s.sale.slot);
                  const tile = state.board[s.sale.city][s.sale.slot]!;
                  return (
                    <button key={i} className={selected ? 'selected' : ''} onClick={() => flow.toggleSale(s)}>
                      {CITIES[s.sale.city].name}: {tile.industry} L{tile.level} (beer ×{s.sale.beerNeeded})
                    </button>
                  );
                })}
                <button className="primary" disabled={flow.flow.sales.length === 0} onClick={flow.confirmSell} data-testid="confirm-sell">
                  Sell {flow.flow.sales.length} building{flow.flow.sales.length === 1 ? '' : 's'}
                </button>
              </div>
            )}

            {flow.flow.action === 'develop' && flow.flow.cardIdx !== null && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="develop-options">
                {flow.develops.map((d, i) => (
                  <button
                    key={i}
                    className={flow.flow.develops.includes(d.industries[0]) ? 'selected' : ''}
                    onClick={() => flow.toggleDevelop(d.industries[0])}
                  >
                    {d.industries[0]}
                  </button>
                ))}
                <button
                  className="primary"
                  disabled={flow.flow.develops.length === 0}
                  onClick={flow.confirmDevelop}
                  data-testid="confirm-develop"
                >
                  Develop {flow.flow.develops.length} tile{flow.flow.develops.length === 1 ? '' : 's'}
                </button>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Log</h3>
            <div className="log" data-testid="log">
              {[...state.log].reverse().map((line, i) => (
                <div key={state.log.length - i} className={i < 6 ? 'recent' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {state.gameOver && (
        <div className="gameover" data-testid="gameover">
          <div className="panel">
            <h2>Game over</h2>
            <p>
              <span className="badge-human">You: {human.vp} VP</span> — <span className="badge-automa">Automa: {automa.vp} VP</span>
            </p>
            <p style={{ fontSize: 22 }}>{human.vp > automa.vp ? '🏆 You win!' : human.vp === automa.vp ? '🤝 Tie!' : '🤖 The Automa wins.'}</p>
          </div>
        </div>
      )}
    </>
  );
}

function flowHint(action: string): string {
  switch (action) {
    case 'build':
      return 'Choose a highlighted city or an option below.';
    case 'network':
      return 'Choose a highlighted link or an option below.';
    case 'sell':
      return 'Toggle buildings to sell, then confirm.';
    case 'develop':
      return 'Pick 1–2 industries, then confirm.';
    default:
      return '';
  }
}
