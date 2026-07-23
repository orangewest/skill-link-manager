interface Props {
  checked: boolean;
  className?: string;
}

/** Empty square when unchecked, square with a checkmark when checked. */
export default function CheckboxIcon({ checked, className = "h-4 w-4" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      {checked && <polyline points="9 12 12 15 16 10" />}
    </svg>
  );
}
