import { CactusLogo } from '../../../components/brand/CactusLogo';
import { Btn } from '../../../components/brand/Btn';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-brand-cream font-sans-brand animate-fade-up">
      <CactusLogo className="mb-10" />
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
        Welcome
      </p>
      <h1 className="font-display font-medium text-[2.5rem] leading-[1.05] tracking-[-0.018em] text-brand-text m-0 mb-3 max-w-sm">
        Let's get to know each other.
      </h1>
      <p className="font-sans-brand text-[15px] text-brand-text-muted m-0 mb-10 leading-relaxed max-w-xs">
        We're going to build your Spending Plan together. But first, a few quick questions.
      </p>
      <p className="font-sans-brand text-[12px] uppercase tracking-[0.14em] font-semibold text-brand-text-faint m-0 mb-8">
        ~ 2 minutes
      </p>
      <div className="w-auto">
        <Btn onClick={onStart} className="px-12">
          Let's do this
        </Btn>
      </div>
    </div>
  );
}
