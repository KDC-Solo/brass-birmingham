import { CITIES, LINKS, MERCHANTS } from './engine/data/board';
import { INDUSTRY_TRACKS } from './engine/data/industries';

export default function App() {
  const tileTotal = Object.values(INDUSTRY_TRACKS)
    .flat()
    .reduce((a, t) => a + t.count, 0);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Brass Birmingham Solo</h1>
      <p>
        Phase 1: rules engine under construction. Board data loaded:{' '}
        {Object.keys(CITIES).length} locations, {LINKS.length} links,{' '}
        {Object.keys(MERCHANTS).length} merchants, {tileTotal} industry tiles per player mat.
      </p>
    </main>
  );
}
