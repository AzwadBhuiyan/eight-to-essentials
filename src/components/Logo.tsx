/**
 * The "8 → E" mark: Eight to Essentials. The same drawing as public/favicon.svg.
 * Decorative here, because the site name is always written next to it.
 */
export function Logo() {
  return (
    <svg
      className="logo"
      data-logo=""
      viewBox="0 0 64 64"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="12" fill="#0b5394" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="15" cy="23.5" r="6.5" />
        <circle cx="15" cy="40.5" r="8.5" />
        <path d="M28 32h10M34 26.5 39.5 32 34 37.5" />
        <path d="M56 16H46v32h10M46 32h8" />
      </g>
    </svg>
  );
}
