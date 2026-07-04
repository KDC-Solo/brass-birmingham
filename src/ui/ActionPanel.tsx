import { useMemo, useState } from 'react';
import type { IndustryType } from '../engine/types';
import { CITIES } from '../engine/data/board';
import { HUMAN, type Card, type GameState } from '../engine/state';
import type { HumanAction } from '../engine/game';
import {
  canLoan, legalBuilds, legalDevelops, legalNetworks, legalSells, scoutAllowed,
  type BuildChoice, type NetworkChoice, type SellChoice,
} from '../engine/options';

type ActionType = 'build' | 'network' | 'sell' | 'develop' | 'loan' | 'scout' | 'pass';

interface Flow {
  action: ActionType | null;
  cardIdx: number | null;
  sales: SellChoice[];
  develops: IndustryType[];
  scoutExtras: number[];
}

const EMPTY_FLOW: Flow = { action: null, cardIdx: null, sales: [], develops: [], scoutExtras: [] };

export function cardLabel(card: Card): string {
  switch (card.kind) {
    case 'location':
      return CITIES[card.city].name;
    case 'industry':
      return card.industries.join(' / ');
    case 'wildLocation':
      return '★ Wild location';
    case 'wildIndustry':
      return '★ Wild industry';
  }
}

export function useActionFlow(state: GameState, dispatch: (action: HumanAction) => string | null) {
  const [flow, setFlow] = useState<Flow>(EMPTY_FLOW);
  const [error, setError] = useState<string | null>(null);

  const builds = useMemo(() => legalBuilds(state), [state]);
  const networks = useMemo(() => legalNetworks(state), [state]);
  const sells = useMemo(() => legalSells(state), [state]);
  const develops = useMemo(() => legalDevelops(state), [state]);

  const hand = state.players[HUMAN].hand;

  const reset = () => {
    setFlow(EMPTY_FLOW);
    setError(null);
  };

  const run = (action: HumanAction) => {
    const err = dispatch(action);
    setError(err);
    if (!err) reset();
  };

  const cardBuilds = flow.cardIdx !== null ? builds.filter((b) => b.cardIdx === flow.cardIdx) : [];

  const availability: Record<ActionType, boolean> = {
    build: builds.length > 0,
    network: networks.length > 0,
    sell: sells.length > 0,
    develop: develops.length > 0,
    loan: canLoan(state),
    scout: scoutAllowed(state),
    pass: hand.length > 0,
  };

  const needsCard = flow.action !== null;
  const cardsSelectable =
    flow.action === 'build'
      ? new Set(builds.map((b) => b.cardIdx))
      : needsCard
        ? new Set(hand.map((_, i) => i))
        : new Set<number>();

  const highlightCities = new Set<string>(
    flow.action === 'build' && flow.cardIdx !== null ? cardBuilds.map((b) => b.option.city) : [],
  );
  const highlightLinks = new Set<string>(
    flow.action === 'network' && flow.cardIdx !== null ? networks.map((n) => n.option.linkIds[0]) : [],
  );

  function chooseAction(action: ActionType) {
    setError(null);
    setFlow({ ...EMPTY_FLOW, action });
  }

  function chooseCard(cardIdx: number) {
    if (!flow.action) return;
    if (flow.action === 'scout') {
      if (flow.cardIdx === null) {
        setFlow({ ...flow, cardIdx });
      } else if (cardIdx !== flow.cardIdx && flow.scoutExtras.length < 2 && !flow.scoutExtras.includes(cardIdx)) {
        const extras = [...flow.scoutExtras, cardIdx];
        if (extras.length === 2) {
          run({ type: 'scout', cardIdx: flow.cardIdx, extraDiscards: extras as [number, number] });
        } else {
          setFlow({ ...flow, scoutExtras: extras });
        }
      }
      return;
    }
    if (flow.action === 'loan') {
      run({ type: 'loan', cardIdx });
      return;
    }
    if (flow.action === 'pass') {
      run({ type: 'pass', cardIdx });
      return;
    }
    setFlow({ ...flow, cardIdx });
  }

  function chooseBuild(choice: BuildChoice) {
    run({ type: 'build', cardIdx: choice.cardIdx, option: choice.option });
  }

  function chooseNetwork(choice: NetworkChoice) {
    if (flow.cardIdx === null) return;
    run({ type: 'network', cardIdx: flow.cardIdx, option: choice.option });
  }

  function toggleSale(choice: SellChoice) {
    const key = (c: SellChoice) => `${c.sale.city}:${c.sale.slot}`;
    const exists = flow.sales.some((s) => key(s) === key(choice));
    setFlow({
      ...flow,
      sales: exists ? flow.sales.filter((s) => key(s) !== key(choice)) : [...flow.sales, choice],
    });
  }

  function confirmSell() {
    if (flow.cardIdx === null || flow.sales.length === 0) return;
    run({
      type: 'sell',
      cardIdx: flow.cardIdx,
      sales: flow.sales.map((s) => ({ sale: s.sale, beer: s.beer })),
    });
  }

  function toggleDevelop(industry: IndustryType) {
    const exists = flow.develops.includes(industry);
    const next = exists ? flow.develops.filter((i) => i !== industry) : [...flow.develops, industry].slice(0, 2);
    setFlow({ ...flow, develops: next });
  }

  function confirmDevelop() {
    if (flow.cardIdx === null || flow.develops.length === 0) return;
    run({ type: 'develop', cardIdx: flow.cardIdx, industries: flow.develops });
  }

  return {
    flow, error, reset, availability, cardsSelectable,
    builds: cardBuilds, networks, sells, develops,
    highlightCities, highlightLinks,
    chooseAction, chooseCard, chooseBuild, chooseNetwork,
    toggleSale, confirmSell, toggleDevelop, confirmDevelop,
  };
}
