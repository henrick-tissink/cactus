import { Btn } from '../../../components/brand/Btn';

interface Phase2WelcomeProps {
  onContinue: () => void;
}

export function Phase2Welcome({ onContinue }: Phase2WelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-brand-cream font-sans-brand animate-fade-up">
      <div className="text-4xl mb-5" aria-hidden="true">
        👋
      </div>
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
        Welcome aboard
      </p>
      <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text m-0 mb-3 max-w-sm">
        You're in.
      </h1>
      <p className="font-sans-brand text-[15px] text-brand-text-muted m-0 mb-2 leading-relaxed max-w-xs">
        Before we connect your bank, let us show you how Cactus thinks about money.
      </p>
      <p className="font-sans-brand text-[13px] text-brand-text-faint m-0 mb-10 leading-relaxed max-w-[260px]">
        It's simpler than you think. Three buckets. That's it. 🪣🪣🪣
      </p>
      <div className="w-auto">
        <Btn onClick={onContinue} className="px-12">
          Show me
        </Btn>
      </div>
    </div>
  );
}
