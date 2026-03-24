interface SpinButtonProps {
  onClick: () => void;
  disabled: boolean;
  spinning: boolean;
}

export default function SpinButton({ onClick, disabled, spinning }: SpinButtonProps) {
  return (
    <button
      className={`spin-button ${spinning ? 'spinning' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {spinning ? 'Spinning...' : 'SPIN'}
    </button>
  );
}
