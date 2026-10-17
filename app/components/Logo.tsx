export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, borderRadius: "6px" }}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="20" fill="#101116" stroke="#262833" strokeWidth="2" />
      <path fill="var(--primary, #F5681A)" d="M 14.1,40.0 L 30.6,40.0 L 38.0,31.2 L 23.4,31.2 L 23.0,23.3 L 45.0,22.9 L 52.4,14.0 L 14.1,14.0 Z" />
      <path fill="var(--primary, #F5681A)" fillRule="evenodd" d="M 85.9,14.0 L 58.8,14.0 L 37.2,39.8 L 37.4,86.0 L 50.3,85.8 L 62.8,72.4 L 63.2,40.0 L 85.9,40.0 Z M 76.8,22.9 L 76.8,31.2 L 62.6,31.2 L 54.1,41.3 L 54.1,68.6 L 46.3,76.9 L 46.1,43.0 L 63.0,22.9 Z" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="brand">
      <LogoIcon size={size} />
      <span>
        Toko<span className="brand-ai">AI</span>
      </span>
    </div>
  );
}

export default Logo;
