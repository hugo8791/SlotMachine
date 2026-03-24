import type { BonusState } from '../api/slotApi';

interface BonusStatusProps {
  bonusState: BonusState;
}

export default function BonusStatus({ bonusState }: BonusStatusProps) {
  if (!bonusState.active) {
    return null;
  }

  return (
    <div className="bonus-status">
      <div className="bonus-status-header">
        <span className="bonus-status-kicker">Bonus Active</span>
        <span className="bonus-status-title">Free Spins</span>
      </div>
      <div className="bonus-status-stats">
        <div className="bonus-stat">
          <span className="bonus-stat-label">Remaining</span>
          <span className="bonus-stat-value">{bonusState.freeSpinsRemaining}</span>
        </div>
        <div className="bonus-stat">
          <span className="bonus-stat-label">Locked Bet</span>
          <span className="bonus-stat-value">{bonusState.lockedBet}</span>
        </div>
        <div className="bonus-stat">
          <span className="bonus-stat-label">Bonus Win</span>
          <span className="bonus-stat-value">+{bonusState.totalBonusWin}</span>
        </div>
      </div>
    </div>
  );
}
