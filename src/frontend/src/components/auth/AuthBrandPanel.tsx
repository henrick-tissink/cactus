import { CactusGlyph } from '../brand/CactusGlyph';
import { CactusLogo } from '../brand/CactusLogo';

/**
 * Auth brand panel — the left-half hero shown on Login, ForgotPassword, ResetPassword.
 * Singular brand statement; not parameterised by copy.
 */
export function AuthBrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="hidden md:flex md:w-1/2 relative overflow-hidden text-brand-cream flex-col justify-between p-12 lg:p-16"
      style={{
        backgroundImage: 'linear-gradient(168deg, #1d5639 0%, #163d2a 55%, #0d2a1c 100%)',
      }}
    >
      {/* Warm paper grain — printed-feel atmosphere over the sage field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.22]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 0.98 0 0 0 0 0.96 0 0 0 0 0.92 0 0 0 0.55 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Glyph watermark — saguaro bleeds off the right edge as a quiet silhouette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[24%] top-1/2 -translate-y-1/2 text-brand-cream opacity-[0.055]"
      >
        <CactusGlyph size={920} />
      </div>

      {/* Soft top-left bloom — sage rim light, adds depth without being a gradient cliché */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, rgba(232,245,238,0.10), rgba(232,245,238,0) 65%)',
        }}
      />

      {/* TOP — wordmark */}
      <div
        className="relative animate-fade-up opacity-0"
        style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
      >
        <CactusLogo tone="dark" />
      </div>

      {/* MIDDLE — hero composition */}
      <div className="relative max-w-[30rem]">
        <h1
          className="font-display font-medium text-[clamp(2.5rem,4.8vw,4rem)] leading-[1.02] tracking-[-0.018em] text-brand-cream animate-fade-up opacity-0"
          style={{ animationDelay: '140ms', animationFillMode: 'forwards' }}
        >
          Build a Spending Plan
          <br />
          <span className="font-display italic font-normal text-brand-cream/82">
            that actually works.
          </span>
        </h1>

        <div
          aria-hidden="true"
          className="mt-9 h-px w-14 bg-brand-terracotta animate-fade-up opacity-0"
          style={{ animationDelay: '260ms', animationFillMode: 'forwards' }}
        />

        <p
          className="mt-7 font-sans-brand text-[15px] leading-[1.68] text-brand-cream/65 max-w-[22rem] animate-fade-up opacity-0"
          style={{ animationDelay: '360ms', animationFillMode: 'forwards' }}
        >
          Track where every Rand goes, hit your goals, and feel calm about money.
        </p>
      </div>

      {/* BOTTOM — editorial footer */}
      <div
        className="relative flex items-end justify-between gap-6 animate-fade-up opacity-0"
        style={{ animationDelay: '460ms', animationFillMode: 'forwards' }}
      >
        <p className="font-sans-brand text-[10px] uppercase tracking-[0.28em] text-brand-cream/40">
          © Cactus Finance
        </p>
        <p className="font-display italic text-brand-cream/35 text-sm leading-none">
          — where the small money went
        </p>
      </div>
    </aside>
  );
}
