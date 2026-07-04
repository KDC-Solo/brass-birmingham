import { useCallback, useEffect, useState } from 'react';
import { newGame, type GameState } from '../engine/state';
import { applyHumanAction, type HumanAction } from '../engine/game';
import type { MautomaDifficulty } from '../engine/mautoma/cards';

const SAVE_KEY = 'bbsolo-save-v1';

interface Session {
  state: GameState;
  history: GameState[];
}

function clone(state: GameState): GameState {
  return structuredClone(state);
}

export function useGame() {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return { state: JSON.parse(raw) as GameState, history: [] };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(session.state));
    } else {
      localStorage.removeItem(SAVE_KEY);
    }
  }, [session]);

  const start = useCallback((seed: number, difficulty: MautomaDifficulty) => {
    setSession({ state: newGame(seed, difficulty), history: [] });
  }, []);

  const dispatch = useCallback((action: HumanAction): string | null => {
    let error: string | null = null;
    setSession((prev) => {
      if (!prev) return prev;
      const next = clone(prev.state);
      try {
        applyHumanAction(next, action);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        return prev;
      }
      const history = [...prev.history, prev.state].slice(-40);
      return { state: next, history };
    });
    return error;
  }, []);

  const undo = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.history.length === 0) return prev;
      return { state: prev.history[prev.history.length - 1], history: prev.history.slice(0, -1) };
    });
  }, []);

  const reset = useCallback(() => setSession(null), []);

  return {
    state: session?.state ?? null,
    canUndo: (session?.history.length ?? 0) > 0,
    start,
    dispatch,
    undo,
    reset,
  };
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bbsolo-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('bbsolo-theme', theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}
