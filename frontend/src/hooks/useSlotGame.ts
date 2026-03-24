import { useState, useRef } from 'react';
import { spinReels, type SpinResult } from '../api/slotApi';

const STARTING_BALANCE = 1000;

export interface SlotGameState {
  balance: number;
  bet: number;
  spinning: boolean;
  lastResult: SpinResult | null;
  error: string | null;
}

export interface SlotGameActions {
  setBet: (bet: number) => void;
  spin: () => Promise<SpinResult | null>;
  clearError: () => void;
}

export function useSlotGame(): SlotGameState & SlotGameActions {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [bet, setBet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spinningRef = useRef(false);

  async function spin(): Promise<SpinResult | null> {
    if (spinningRef.current) return null;
    if (balance < bet) {
      setError('Not enough credits!');
      return null;
    }

    spinningRef.current = true;
    setSpinning(true);
    setError(null);

    try {
      const result = await spinReels(bet);
      setLastResult(result);
      setBalance(prev => prev - bet + result.winAmount);
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
    setBet,
    spin,
    clearError: () => setError(null),
  };
}
