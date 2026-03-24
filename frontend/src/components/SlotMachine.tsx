import { useEffect, useMemo, useRef, useState } from 'react';
import Reel, { type ReelHandle } from './Reel';
import type { SpinResult, WinLine } from '../api/slotApi';

const REEL_STOP_DELAY_BASE = 0.6;  // seconds per reel gap
const MIN_SPIN_DURATION = 1.5;     // minimum spin duration before stopping

interface SlotMachineProps {
  lastResult: SpinResult | null;
  onSpinComplete: (result: SpinResult) => void;
  isAnimating: boolean;
}

export interface SlotMachineHandle {
  playSpinAnimation: (result: SpinResult) => Promise<void>;
}

import { forwardRef, useImperativeHandle } from 'react';

const REEL_WIDTH = 120;
const REEL_HEIGHT = 360;
const REEL_GAP = 10;
const CONTAINER_PADDING = 20;
const ROW_HEIGHT = 120;
const SVG_WIDTH = CONTAINER_PADDING * 2 + REEL_WIDTH * 5 + REEL_GAP * 4;
const SVG_HEIGHT = CONTAINER_PADDING * 2 + REEL_HEIGHT;

function buildPaylinePoints(line: WinLine): string {
  return line.rows
    .map((row, reelIndex) => {
      const x = CONTAINER_PADDING + reelIndex * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2;
      const y = CONTAINER_PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;
      return `${x},${y}`;
    })
    .join(' ');
}

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(
  ({ lastResult, isAnimating }, ref) => {
    const reelRefs = useRef<(ReelHandle | null)[]>([null, null, null, null, null]);
    const [activeWinLineIndex, setActiveWinLineIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      async playSpinAnimation(result: SpinResult) {
        const animationPromises = result.reels.map((reelSymbols, i) => {
          const reel = reelRefs.current[i];
          if (!reel) return Promise.resolve();
          const stopDelay = MIN_SPIN_DURATION + i * REEL_STOP_DELAY_BASE;
          return reel.spin(reelSymbols, stopDelay);
        });
        await Promise.all(animationPromises);
      },
    }));

    useEffect(() => {
      if (isAnimating || !lastResult || lastResult.winningLines.length === 0) {
        setActiveWinLineIndex(0);
        return;
      }

      const intervalId = window.setInterval(() => {
        setActiveWinLineIndex(prev => (prev + 1) % lastResult.winningLines.length);
      }, 1600);

      return () => window.clearInterval(intervalId);
    }, [isAnimating, lastResult]);

    const activeWinLine = !isAnimating && lastResult && lastResult.winningLines.length > 0
      ? lastResult.winningLines[activeWinLineIndex]
      : null;

    const highlightedRowsByReel = useMemo(
      () => Array.from({ length: 5 }, (_, reelIndex) => {
        if (!activeWinLine || reelIndex >= activeWinLine.count) {
          return undefined;
        }

        return new Set([activeWinLine.rows[reelIndex]]);
      }),
      [activeWinLine]
    );

    const displayReels: string[][] = lastResult?.reels ?? [
      ['🍒', '🍋', '🍇'],
      ['🔔', '💎', '⭐'],
      ['🃏', '🍒', '🍋'],
      ['🍇', '🔔', '💎'],
      ['⭐', '7️⃣', '🍒'],
    ];

    return (
      <div className="slot-machine">
        <div className="reels-shell">
          <div className="reels-container">
            {displayReels.map((symbols, i) => (
              <Reel
                key={i}
                ref={el => { reelRefs.current[i] = el; }}
                initialSymbols={symbols}
                highlightedRows={highlightedRowsByReel[i]}
              />
            ))}
          </div>
          {activeWinLine && (
            <svg
              className="win-line-overlay"
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              aria-hidden="true"
            >
              <polyline
                className="win-line-glow"
                points={buildPaylinePoints(activeWinLine)}
              />
              <polyline
                className="win-line-path"
                points={buildPaylinePoints(activeWinLine)}
              />
            </svg>
          )}
        </div>
        {!isAnimating && lastResult && lastResult.winAmount > 0 && (
          <div className="win-result">
            <div className="win-total">+{lastResult.winAmount} credits</div>
            <div className="win-lines-info">
              {lastResult.winningLines.map((line, i) => (
                <div
                  key={line.lineId}
                  className={`win-line-badge${activeWinLine?.lineId === line.lineId ? ' active' : ''}`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  Line {line.lineId}: {line.symbol} ×{line.count} = +{line.payout}
                </div>
              ))}
            </div>
          </div>
        )}
        {!isAnimating && lastResult && lastResult.winAmount === 0 && lastResult.winningLines.length === 0 && (
          <div className="no-win">No win this time</div>
        )}
      </div>
    );
  }
);

SlotMachine.displayName = 'SlotMachine';
export default SlotMachine;
