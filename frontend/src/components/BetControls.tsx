const BET_OPTIONS = [1, 2, 5, 10];

interface BetControlsProps {
  bet: number;
  onBetChange: (bet: number) => void;
  disabled: boolean;
}

export default function BetControls({ bet, onBetChange, disabled }: BetControlsProps) {
  return (
    <div className="bet-controls">
      <span className="bet-label">Bet</span>
      {BET_OPTIONS.map(option => (
        <button
          key={option}
          className={`bet-button ${bet === option ? 'active' : ''}`}
          onClick={() => onBetChange(option)}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
