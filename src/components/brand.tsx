export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path
        d="M5 8H14L24 18L14 28H5"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 18H30M24 12L30 18L24 24"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Mark />
      </span>
      <span>
        capta<span className="brand-light">flow</span>
        <span className="brand-period">.</span>
      </span>
    </span>
  );
}
