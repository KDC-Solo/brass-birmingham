import { useState } from 'react';

export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} data-testid="help-open" aria-label="How to play">
        ？Help
      </button>
      {open && (
        <div className="gameover" onClick={() => setOpen(false)} data-testid="help-modal">
          <div className="panel help-body" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 style={{ margin: 0, flex: 1 }}>How to play</h2>
              <button onClick={() => setOpen(false)} data-testid="help-close">
                ✕ Close
              </button>
            </div>

            <h3>Goal</h3>
            <p>
              Score more victory points than the Automa. VP come from your <b>flipped</b> industry tiles and your links,
              scored at the end of each of the two eras (Canal, then Rail).
            </p>

            <h3>Your turn</h3>
            <p>
              You take <b>two actions</b> per turn (only one on the game's very first turn). Every action costs one card
              from your hand — pick the action, then the card, then the target. Legal targets are highlighted on the
              board and listed as buttons. After your turn the Automa plays automatically; read the log to see what it
              did. When the draw pile and your hand run out, the era ends.
            </p>

            <h3>Actions</h3>
            <ul>
              <li>
                <b>Build</b> — place an industry tile. A <i>location card</i> builds anything at that city; an{' '}
                <i>industry card</i> builds that industry anywhere in your network. Tiles may need coal (needs a
                connection to a mine or market) and iron (from anywhere).
              </li>
              <li>
                <b>Network</b> — place a link (canal era: £3; rail era: £5 + coal). Links extend your network and score
                VP from adjacent tiles' link icons at era end.
              </li>
              <li>
                <b>Sell</b> — flip cotton/goods/pottery connected to a merchant that buys them, paying beer per tile.
                Using a merchant's own beer grants its bonus. Flipping raises your income.
              </li>
              <li>
                <b>Develop</b> — remove 1–2 low tiles from your mat (1 iron each) to unlock better ones. You must
                develop past level-1 tiles to build in the Rail Era.
              </li>
              <li>
                <b>Loan</b> — +£30, −3 income levels. <b>Scout</b> — discard 3 cards for two wild cards.{' '}
                <b>Pass</b> — discard a card and do nothing.
              </li>
            </ul>

            <h3>Board legend</h3>
            <p>
              🧵 cotton mill · 📦 manufactured goods · 🏺 pottery · ⚫ coal mine · 🔩 iron works · 🍺 brewery. Empty slots
              show what may be built there. On built tiles, the small left number is remaining resources, the right
              number is the tile level; faded tiles are flipped. <span className="badge-human">Teal is you</span>,{' '}
              <span className="badge-automa">red is the Automa</span>. Dashed lines are rail-only routes; dash-dot lines
              are canal-only.
            </p>

            <h3>The Automa</h3>
            <p>
              It plays by the Mautoma rules (Mauro Gibertoni's solo variant): each of its turns it reveals a card and
              takes the printed actions — it pays no money but consumes real coal, iron and beer, occupies board slots
              and links, and scores like a player, plus bonus VP when it passes or develops. It never loans, scouts or
              overbuilds. Difficulty changes which tiles it starts with.
            </p>

            <h3>Income &amp; money</h3>
            <p>
              After each round you collect (or pay!) your income level. If you can't pay, tiles are force-sold at half
              cost. Flipping tiles and selling raises income; loans lower it.
            </p>

            <p style={{ color: 'var(--muted)' }}>
              Full rules: the official rulebook from{' '}
              <a href="https://roxley.com/products/brass-birmingham" target="_blank" rel="noreferrer">
                Roxley
              </a>{' '}
              and the Mautoma rules at{' '}
              <a href="https://www.mautoma.com/brass-birmingham" target="_blank" rel="noreferrer">
                mautoma.com
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}
