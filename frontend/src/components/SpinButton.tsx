interface SpinButtonProps {
  onClick: () => void;
  disabled: boolean;
  active: boolean;
  label: string;
}

export default function SpinButton({ onClick, disabled, active, label }: SpinButtonProps) {
  return (
    <button
      className={`spin-button ${active ? 'spinning' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
