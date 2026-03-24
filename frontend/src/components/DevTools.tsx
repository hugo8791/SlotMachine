interface DevToolsProps {
  disabled: boolean;
  onStartBonus: (withStickyWilds: boolean) => void;
  onClearBonus: () => void;
}

export default function DevTools({ disabled, onStartBonus, onClearBonus }: DevToolsProps) {
  return (
    <div className="dev-tools">
      <div className="dev-tools-header">
        <span className="dev-tools-kicker">Debug Only</span>
        <span className="dev-tools-title">Bonus Dev Tools</span>
      </div>
      <div className="dev-tools-actions">
        <button type="button" className="dev-tool-button" onClick={() => onStartBonus(false)} disabled={disabled}>
          Start Bonus
        </button>
        <button type="button" className="dev-tool-button" onClick={() => onStartBonus(true)} disabled={disabled}>
          Start With Sticky Wilds
        </button>
        <button type="button" className="dev-tool-button dev-tool-button-danger" onClick={onClearBonus} disabled={disabled}>
          Clear Bonus
        </button>
      </div>
    </div>
  );
}
