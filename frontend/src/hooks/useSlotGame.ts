import { useState, useRef } from 'react';
import { spinReels, type BonusState, type SpinResult } from '../api/slotApi';

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
  lastResult: SpinResult | null;
  error: string | null;
  bonusState: BonusState;
}

export interface SlotGameActions {
  setBet: (bet: number) => void;
  spin: () => Promise<SpinResult | null>;
  setBonusState: (bonusState: BonusState) => void;
  clearError: () => void;
}

export function useSlotGame(): SlotGameState & SlotGameActions {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [bet, setBet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bonusState, setBonusState] = useState<BonusState>(EMPTY_BONUS_STATE);

  const spinningRef = useRef(false);

  async function spin(): Promise<SpinResult | null> {
    if (spinningRef.current) return null;
    const bonusActive = lastResult?.bonusState.active ?? false;

    if (!bonusActive && balance < bet) {
      setError('Not enough credits!');
      return null;
    }

    spinningRef.current = true;
    setSpinning(true);
    setError(null);

    try {
      const result = await spinReels(bet);
      setLastResult(result);
      setBonusState(result.bonusState);
      if (result.bonusState.active && result.bonusState.lockedBet > 0) {
        setBet(result.bonusState.lockedBet);
      }

      const spinCost = result.spinMode === 'bonus' ? 0 : bet;
      setBalance(prev => prev - spinCost + result.winAmount);
      return result;
    } catch (err) {
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
    lastResult,
    error,
    bonusState,
    setBet,
    spin,
    setBonusState,
    clearError: () => setError(null),
  };
}
