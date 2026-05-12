import { CactusLogo } from '../brand/CactusLogo';

interface AuthBrandPanelProps {
  heading: string;
  tagline: string;
}

export function AuthBrandPanel({ heading, tagline }: AuthBrandPanelProps) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-[var(--cactus-forest)] text-white p-12 flex-col justify-between">
      <CactusLogo tone="dark" />
      <div>
        <h1 className="font-cactus font-bold text-3xl mb-3 leading-tight">{heading}</h1>
        <p className="font-cactus text-[15px] text-white/70 leading-relaxed">{tagline}</p>
      </div>
      <p className="font-cactus text-xs text-white/40">© Cactus Finance</p>
    </div>
  );
}
