import { useEffect, useRef, useState } from 'react';
import { getGameState, spinReels, updateBet, type BonusState, type SpinResult } from '../api/slotApi';

const STARTING_BALANCE = 1000;
const EMPTY_BONUS_STATE: BonusState = {
  active: false,
  freeSpinsRemaining: 0,
  lockedBet: 0,
  stickyWildPositions: [],
  spinsAwarded: 0,
  totalBonusWin: 0,
};

export interface SlotGameState {
  balance: number;
  bet: number;
  spinning: boolean;
  loading: boolean;
  lastResult: SpinResult | null;
  error: string | null;
  bonusState: BonusState;
}

export interface SlotGameActions {
  setBet: (bet: number) => void;
  spin: () => Promise<SpinResult | null>;
  applySpinResult: (result: SpinResult) => void;
  setBonusState: (bonusState: BonusState) => void;
  clearError: () => void;
}

export function useSlotGame(): SlotGameState & SlotGameActions {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [bet, setBet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bonusState, setBonusState] = useState<BonusState>(EMPTY_BONUS_STATE);

  const spinningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadGameState() {
      try {
        const state = await getGameState();
        if (cancelled) return;

        setBalance(state.balance);
        setBet(state.bet);
        setLastResult(state.lastResult);
        setBonusState(state.bonusState);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load saved game.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGameState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSetBet(nextBet: number) {
    setBet(nextBet);

    try {
      const state = await updateBet(nextBet);
      setBet(state.bet);
      setBalance(state.balance);
      setLastResult(state.lastResult);
      setBonusState(state.bonusState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bet.');
    }
  }

  async function spin(): Promise<SpinResult | null> {
    if (spinningRef.current || loading) return null;
    const bonusActive = bonusState.active;
    const spinCost = bonusActive ? 0 : bet;

    if (!bonusActive && balance < bet) {
      setError('Not enough credits!');
      return null;
    }

    spinningRef.current = true;
    setSpinning(true);
    setError(null);
    if (spinCost > 0) {
      setBalance(prev => prev - spinCost);
    }

    try {
      const result = await spinReels(bet);
      setLastResult(result);
      setBonusState(result.bonusState);
      if (result.bonusState.active && result.bonusState.lockedBet > 0) {
        setBet(result.bonusState.lockedBet);
      }
      return result;
    } catch (err) {
      if (spinCost > 0) {
        setBalance(prev => prev + spinCost);
      }
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      return null;
    } finally {
      spinningRef.current = false;
      setSpinning(false);
    }
  }

  return {
    balance,
    bet,
    spinning,
    loading,
    lastResult,
    error,
    bonusState,
    setBet: handleSetBet,
    spin,
    applySpinResult: (result: SpinResult) => setBalance(result.balance),
    setBonusState,
    clearError: () => setError(null),
  };
}
