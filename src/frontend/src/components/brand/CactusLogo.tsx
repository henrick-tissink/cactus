import { CactusGlyph } from './CactusGlyph';

interface CactusLogoProps {
  className?: string;
  tone?: 'light' | 'dark';
}

export function CactusLogo({ className = '', tone = 'light' }: CactusLogoProps) {
  const wordmarkClass = tone === 'dark' ? 'text-cactus-mint' : 'text-cactus-charcoal';
  const glyphClass = tone === 'dark' ? 'text-cactus-mint' : 'text-cactus-sage';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CactusGlyph className={glyphClass} size={28} />
      <span className={`font-display font-medium text-2xl ${wordmarkClass} tracking-tight`}>
        cactus
      </span>
    </div>
  );
}
