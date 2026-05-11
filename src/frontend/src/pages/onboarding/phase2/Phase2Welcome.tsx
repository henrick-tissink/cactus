import { Btn } from '../../../components/brand/Btn';

interface Phase2WelcomeProps {
  onContinue: () => void;
}

export function Phase2Welcome({ onContinue }: Phase2WelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <div className="text-5xl mb-3" aria-hidden="true">
        👋
      </div>
      <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal m-0 mb-2">
        You're in! Welcome.
      </h1>
      <p className="font-cactus text-base text-cactus-charcoal/60 font-medium m-0 mb-2 leading-relaxed max-w-xs">
        Before we connect your bank, let us show you how Cactus thinks about money.
      </p>
      <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-9 leading-relaxed max-w-[260px]">
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
