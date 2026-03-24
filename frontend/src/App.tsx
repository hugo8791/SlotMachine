import { useEffect, useRef, useState } from 'react';
import { useSlotGame } from './hooks/useSlotGame';
import SlotMachine, { type SlotMachineHandle } from './components/SlotMachine';
import BalanceDisplay from './components/BalanceDisplay';
import BetControls from './components/BetControls';
import SpinButton from './components/SpinButton';
import WinModal from './components/WinModal';
import './App.css';

const BIG_WIN_THRESHOLD = 50;

export default function App() {
  const { balance, bet, spinning, lastResult, error, setBet, spin, clearError } = useSlotGame();
  const slotMachineRef = useRef<SlotMachineHandle>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [pendingWin, setPendingWin] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fastSpinEnabled, setFastSpinEnabled] = useState(false);
  const [autoSpinEnabled, setAutoSpinEnabled] = useState(false);

  async function handleSpin() {
    if (isAnimating) {
      slotMachineRef.current?.skipToResult();
      return;
    }

    const result = await spin();
    if (!result) return;

    setIsAnimating(true);
    await slotMachineRef.current?.playSpinAnimation(result, fastSpinEnabled);
    setIsAnimating(false);

    if (result.winAmount >= BIG_WIN_THRESHOLD) {
      setAutoSpinEnabled(false);
      setPendingWin(result.winAmount);
      setShowWinModal(true);
    }
  }

  useEffect(() => {
    if (!autoSpinEnabled || spinning || isAnimating || showWinModal) {
      return;
    }

    if (balance < bet) {
      setAutoSpinEnabled(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSpin();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [autoSpinEnabled, balance, bet, spinning, isAnimating, showWinModal]);

  return (
    <div className="app">
      <h1 className="app-title">Slot Machine</h1>

      <BalanceDisplay balance={balance} />

      <SlotMachine
        ref={slotMachineRef}
        lastResult={lastResult}
        onSpinComplete={() => {}}
        isAnimating={isAnimating}
      />

      <div className="controls">
        <BetControls bet={bet} onBetChange={setBet} disabled={spinning || isAnimating} />
        <button
          className={`fast-spin-button${fastSpinEnabled ? ' active' : ''}`}
          onClick={() => setFastSpinEnabled(enabled => !enabled)}
          disabled={spinning || isAnimating}
          type="button"
        >
          Fast Spin {fastSpinEnabled ? 'On' : 'Off'}
        </button>
        <button
          className={`auto-spin-button${autoSpinEnabled ? ' active' : ''}`}
          onClick={() => setAutoSpinEnabled(enabled => !enabled)}
          disabled={spinning}
          type="button"
        >
          Auto Spin {autoSpinEnabled ? 'On' : 'Off'}
        </button>
        <SpinButton
          onClick={handleSpin}
          disabled={spinning || (!isAnimating && balance < bet)}
          active={spinning || isAnimating}
          label={spinning ? 'Spinning...' : isAnimating ? 'Stop' : 'SPIN'}
        />
      </div>

      {error && (
        <div className="error-message" onClick={clearError}>
          {error}
        </div>
      )}

      {showWinModal && (
        <WinModal
          winAmount={pendingWin}
          onClose={() => setShowWinModal(false)}
        />
      )}
    </div>
  );
}
