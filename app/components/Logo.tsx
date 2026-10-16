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
      <rect width="100" height="100" rx="20" fill="#181411" stroke="#2E2722" strokeWidth="2" />
      <rect x="15" y="14" width="22" height="72" rx="11" fill="var(--primary, #F28C38)" />
      <polygon points="65,14 87,14 62.5,50 87,86 65,86 40.5,50" fill="var(--primary, #F28C38)" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="brand">
      <LogoIcon size={size} />
      <span>
        Kios<span className="brand-ai">AI</span>
      </span>
    </div>
  );
}

export default Logo;
