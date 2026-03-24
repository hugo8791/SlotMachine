interface WinModalProps {
  title: string;
  value: string;
  subtitle?: string;
  buttonLabel: string;
  onClose: () => void;
}

export default function WinModal({ title, value, subtitle, buttonLabel, onClose }: WinModalProps) {
  return (
    <div className="win-modal-backdrop" onClick={onClose}>
      <div className="win-modal" onClick={e => e.stopPropagation()}>
        <div className="win-modal-title">{title}</div>
        <div className="win-modal-amount">{value}</div>
        {subtitle && <div className="win-modal-subtitle">{subtitle}</div>}
        <button className="win-modal-close" onClick={onClose}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
