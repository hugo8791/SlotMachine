import { useEffect, useRef, useState } from 'react';
import { useSlotGame } from './hooks/useSlotGame';
import SlotMachine, { type SlotMachineHandle } from './components/SlotMachine';
import BalanceDisplay from './components/BalanceDisplay';
import BetControls from './components/BetControls';
import SpinButton from './components/SpinButton';
import BonusStatus from './components/BonusStatus';
import DevTools from './components/DevTools';
import WinModal from './components/WinModal';
import { clearDebugBonus, startDebugBonus } from './api/slotApi';
import './App.css';

const BIG_WIN_THRESHOLD = 50;
const IS_DEV = import.meta.env.DEV;

interface ModalState {
  title: string;
  value: string;
  subtitle?: string;
  buttonLabel: string;
}

export default function App() {
  const { balance, bet, spinning, lastResult, error, bonusState, setBet, spin, setBonusState, clearError } = useSlotGame();
  const slotMachineRef = useRef<SlotMachineHandle>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fastSpinEnabled, setFastSpinEnabled] = useState(false);
  const [autoSpinEnabled, setAutoSpinEnabled] = useState(false);

  async function handleSpin() {
    if (isAnimating) {
      slotMachineRef.current?.skipToResult();
      return;
    }

    const lockedStickyPositions = bonusState.active ? bonusState.stickyWildPositions : [];
    const result = await spin();
    if (!result) return;

    setIsAnimating(true);
    await slotMachineRef.current?.playSpinAnimation(result, fastSpinEnabled, lockedStickyPositions);
    setIsAnimating(false);

    if (result.isBonusTrigger) {
      setAutoSpinEnabled(false);
      setModalState({
        title: 'BONUS TRIGGERED',
        value: `${result.bonusState.spinsAwarded} FREE SPINS`,
        subtitle: `${result.scatterCount} scatters landed. Sticky wilds are live in the bonus.`,
        buttonLabel: 'Start Bonus',
      });
      return;
    }

    if (result.isBonusComplete) {
      setModalState({
        title: 'BONUS COMPLETE',
        value: `+${result.completedBonusWinAmount.toLocaleString()} credits`,
        subtitle: 'Your free-spin round has finished.',
        buttonLabel: 'Collect',
      });
      return;
    }

    if (result.winAmount >= BIG_WIN_THRESHOLD) {
      setAutoSpinEnabled(false);
      setModalState({
        title: 'BIG WIN!',
        value: `+${result.winAmount.toLocaleString()} credits`,
        buttonLabel: 'Collect',
      });
    }
  }

  useEffect(() => {
    if (!autoSpinEnabled || spinning || isAnimating || modalState || bonusState.active) {
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
  }, [autoSpinEnabled, balance, bet, spinning, isAnimating, modalState, bonusState.active]);

  useEffect(() => {
    if (bonusState.active && autoSpinEnabled) {
      setAutoSpinEnabled(false);
    }
  }, [bonusState.active, autoSpinEnabled]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      void handleSpin();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin]);

  async function handleStartDebugBonus(withStickyWilds: boolean) {
    try {
      setAutoSpinEnabled(false);
      const nextBonusState = await startDebugBonus({ bet, withStickyWilds });
      setBonusState(nextBonusState);
      if (nextBonusState.lockedBet > 0) {
        setBet(nextBonusState.lockedBet);
      }
      setModalState({
        title: 'DEBUG BONUS READY',
        value: withStickyWilds ? 'Sticky wild layout loaded' : 'Free spins armed',
        subtitle: 'Press spin or spacebar to play the debug bonus round.',
        buttonLabel: 'Play',
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClearDebugBonus() {
    try {
      setAutoSpinEnabled(false);
      setBonusState(await clearDebugBonus());
      setModalState(null);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="app">
      <h1 className="app-title">Slot Machine</h1>

      <BalanceDisplay balance={balance} />
      <BonusStatus bonusState={bonusState} />

      <SlotMachine
        ref={slotMachineRef}
        lastResult={lastResult}
        isAnimating={isAnimating}
      />

      <div className="controls">
        <BetControls bet={bet} onBetChange={setBet} disabled={spinning || isAnimating || bonusState.active} />
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
          disabled={spinning || bonusState.active}
          type="button"
        >
          Auto Spin {autoSpinEnabled ? 'On' : 'Off'}
        </button>
        <SpinButton
          onClick={handleSpin}
          disabled={spinning || (!isAnimating && !bonusState.active && balance < bet)}
          active={spinning || isAnimating}
          label={
            spinning
              ? 'Spinning...'
              : isAnimating
                ? 'Stop'
                : bonusState.active
                  ? `FREE SPIN (${bonusState.freeSpinsRemaining})`
                  : 'SPIN'
          }
        />
      </div>
      {bonusState.active && (
        <div className="bonus-lock-note">
          Bonus bet locked at {bonusState.lockedBet}. Bonus spins do not cost credits.
        </div>
      )}
      {IS_DEV && (
        <DevTools
          disabled={spinning || isAnimating}
          onStartBonus={withStickyWilds => {
            void handleStartDebugBonus(withStickyWilds);
          }}
          onClearBonus={() => {
            void handleClearDebugBonus();
          }}
        />
      )}

      {error && (
        <div className="error-message" onClick={clearError}>
          {error}
        </div>
      )}

      {modalState && (
        <WinModal
          title={modalState.title}
          value={modalState.value}
          subtitle={modalState.subtitle}
          buttonLabel={modalState.buttonLabel}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}
