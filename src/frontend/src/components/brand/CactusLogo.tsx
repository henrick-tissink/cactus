interface CactusLogoProps {
  className?: string;
  tone?: 'light' | 'dark';
}

export function CactusLogo({ className = '', tone = 'light' }: CactusLogoProps) {
  const wordmarkClass = tone === 'dark' ? 'text-cactus-mint' : 'text-cactus-charcoal';
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="11" y="4" width="6" height="20" rx="3" className="fill-cactus-sage" />
        <rect
          x="4"
          y="10"
          width="8"
          height="4"
          rx="2"
          transform="rotate(-15 8 12)"
          className="fill-cactus-sage"
        />
        <rect
          x="16"
          y="8"
          width="8"
          height="4"
          rx="2"
          transform="rotate(15 20 10)"
          className="fill-cactus-sage"
        />
        <circle cx="14" cy="3" r="2" className="fill-cactus-prickly" />
        <circle cx="15" cy="2.2" r="0.8" className="fill-cactus-desert" />
      </svg>
      <span className={`font-cactus font-bold text-xl ${wordmarkClass} tracking-tight`}>
        cactus
      </span>
    </div>
  );
}
