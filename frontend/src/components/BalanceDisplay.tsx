interface BalanceDisplayProps {
  balance: number;
}

export default function BalanceDisplay({ balance }: BalanceDisplayProps) {
  return (
    <div className="balance-display">
      <span className="balance-label">Credits</span>
      <span className="balance-value">{balance.toLocaleString()}</span>
    </div>
  );
}
