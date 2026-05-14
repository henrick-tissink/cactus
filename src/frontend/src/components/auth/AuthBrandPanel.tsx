import { CactusLogo } from '../brand/CactusLogo';

interface AuthBrandPanelProps {
  heading: string;
  tagline: string;
}

export function AuthBrandPanel({ heading, tagline }: AuthBrandPanelProps) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-cream via-brand-cream to-brand-terracotta-soft text-brand-text p-12 flex-col justify-between">
      <CactusLogo tone="light" />
      <div>
        <h1 className="font-display font-medium text-4xl mb-3 leading-tight tracking-tight text-brand-text">
          {heading}
        </h1>
        <p className="font-sans-brand text-[15px] text-brand-text-muted leading-relaxed">
          {tagline}
        </p>
      </div>
      <p className="font-sans-brand text-xs text-brand-text-faint">© Cactus Finance</p>
    </div>
  );
}
