import { useEffect, useMemo, useRef, useState } from 'react';
import Reel, { type ReelHandle } from './Reel';
import type { BonusState, SpinResult, StickyPosition, WinLine } from '../api/slotApi';

const REEL_STOP_DELAY_BASE = 0.6;  // seconds per reel gap
const MIN_SPIN_DURATION = 1.5;     // minimum spin duration before stopping
const FAST_REEL_STOP_DELAY_BASE = 0.16;
const FAST_MIN_SPIN_DURATION = 0.4;

interface SlotMachineProps {
  lastResult: SpinResult | null;
  bonusState: BonusState;
  isAnimating: boolean;
}

export interface SlotMachineHandle {
  playSpinAnimation: (
    result: SpinResult,
    fastSpin: boolean,
    lockedStickyPositions?: StickyPosition[]
  ) => Promise<void>;
  skipToResult: () => void;
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
  ({ lastResult, bonusState, isAnimating }, ref) => {
    const reelRefs = useRef<(ReelHandle | null)[]>([null, null, null, null, null]);
    const [activeWinLineIndex, setActiveWinLineIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      async playSpinAnimation(result: SpinResult, fastSpin: boolean, lockedStickyPositions: StickyPosition[] = []) {
        const baseDelay = fastSpin ? FAST_REEL_STOP_DELAY_BASE : REEL_STOP_DELAY_BASE;
        const minimumDuration = fastSpin ? FAST_MIN_SPIN_DURATION : MIN_SPIN_DURATION;
        const lockedRowsByReel = Array.from({ length: 5 }, (_, reelIndex) => {
          const lockedRows = lockedStickyPositions
            .filter(position => position.reel === reelIndex)
            .map(position => position.row);

          return lockedRows.length > 0 ? new Set(lockedRows) : undefined;
        });

        const animationPromises = result.reels.map((reelSymbols, i) => {
          const reel = reelRefs.current[i];
          if (!reel) return Promise.resolve();
          const stopDelay = minimumDuration + i * baseDelay;
          return reel.spin(reelSymbols, stopDelay, lockedRowsByReel[i]);
        });
        await Promise.all(animationPromises);
      },
      skipToResult() {
        reelRefs.current.forEach(reel => reel?.skipToResult());
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

    const stickyRowsByReel = useMemo(
      () => Array.from({ length: 5 }, (_, reelIndex) => {
        if (!lastResult) {
          return undefined;
        }

        const stickyRows = bonusState.stickyWildPositions
          .filter((position: StickyPosition) => position.reel === reelIndex)
          .map(position => position.row);

        return stickyRows.length > 0 ? new Set(stickyRows) : undefined;
      }),
      [bonusState.stickyWildPositions, lastResult]
    );

    const displayReels: string[][] = lastResult?.reels ?? [
      ['🍒', '🍋', '🍇'],
      ['🔔', '💎', '⭐'],
      ['🎁', '🍒', '🍋'],
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
                stickyRows={stickyRowsByReel[i]}
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
