import { useImperativeHandle, forwardRef, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const SYMBOL_HEIGHT = 120; // px

export interface ReelHandle {
  spin: (finalSymbols: string[], stopDelay: number) => Promise<void>;
}

interface ReelProps {
  initialSymbols?: string[];
  highlightedRows?: Set<number>;
}

const ALL_SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '⭐', '🃏', '7️⃣'];
const EXTRA_COUNT = 12;

const Reel = forwardRef<ReelHandle, ReelProps>(({ initialSymbols = ['🍒', '🍋', '🍇'], highlightedRows }, ref) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [visibleSymbols, setVisibleSymbols] = useState<string[]>(initialSymbols);
  const [spinStrip, setSpinStrip] = useState<string[] | null>(null);

  useLayoutEffect(() => {
    if (spinStrip === null && stripRef.current) {
      gsap.set(stripRef.current, { y: 0 });
    }
  }, [spinStrip]);

  useImperativeHandle(ref, () => ({
    async spin(finalSymbols: string[], stopDelay: number): Promise<void> {
      const strip = stripRef.current;
      if (!strip) return;

      gsap.killTweensOf(strip);
      gsap.set(strip, { y: 0 });

      const extras = Array.from({ length: EXTRA_COUNT }, () =>
        ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]
      );
      // Prepend current visible symbols so y:0 shows the same thing as before — no visual jump
      const currentSymbols = visibleSymbols;
      const fullStrip = [...currentSymbols, ...extras, ...finalSymbols];
      setSpinStrip(fullStrip);

      // At y:0 we see currentSymbols; animate until finalSymbols are visible
      const endY = -((currentSymbols.length + extras.length) * SYMBOL_HEIGHT);

      return new Promise<void>(resolve => {
        gsap.to(strip, {
            y: endY,
            duration: stopDelay + 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
              setVisibleSymbols(finalSymbols);
              setSpinStrip(null);
              resolve();
            },
          }
        );
      });
    },
  }));

  const symbols = spinStrip ?? visibleSymbols;

  return (
    <div className="reel-viewport">
      <div className="reel-strip" ref={stripRef}>
        {symbols.map((symbol, i) => (
          <div
            key={i}
            className={`reel-symbol${spinStrip === null && highlightedRows?.has(i) ? ' reel-symbol-winning' : ''}`}
          >
            {symbol}
          </div>
        ))}
      </div>
    </div>
  );
});

Reel.displayName = 'Reel';
export default Reel;
