interface WinModalProps {
  winAmount: number;
  onClose: () => void;
}

export default function WinModal({ winAmount, onClose }: WinModalProps) {
  return (
    <div className="win-modal-backdrop" onClick={onClose}>
      <div className="win-modal" onClick={e => e.stopPropagation()}>
        <div className="win-modal-title">BIG WIN!</div>
        <div className="win-modal-amount">+{winAmount.toLocaleString()} credits</div>
        <button className="win-modal-close" onClick={onClose}>
          Collect
        </button>
      </div>
    </div>
  );
}
