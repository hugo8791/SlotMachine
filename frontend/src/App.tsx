import { useRef, useState } from 'react';
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

  async function handleSpin() {
    const result = await spin();
    if (!result) return;

    setIsAnimating(true);
    await slotMachineRef.current?.playSpinAnimation(result);
    setIsAnimating(false);

    if (result.winAmount >= BIG_WIN_THRESHOLD) {
      setPendingWin(result.winAmount);
      setShowWinModal(true);
    }
  }

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
        <SpinButton onClick={handleSpin} disabled={spinning || isAnimating || balance < bet} spinning={spinning || isAnimating} />
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
