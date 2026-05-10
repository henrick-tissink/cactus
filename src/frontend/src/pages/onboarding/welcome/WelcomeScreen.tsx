import { CactusLogo } from '../../../components/brand/CactusLogo';
import { Btn } from '../../../components/brand/Btn';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <CactusLogo className="mb-8" />
      <div className="text-6xl mb-4" aria-hidden="true">
        🌵
      </div>
      <h1 className="font-cactus font-bold text-3xl text-cactus-charcoal m-0 mb-2">
        Welcome to Cactus
      </h1>
      <p className="font-cactus text-base text-cactus-charcoal/60 font-medium m-0 mb-8 leading-relaxed max-w-xs">
        We're going to build your Spending Plan together. But first, let's get to know each other a
        little.
      </p>
      <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-8">
        🕐 Takes about 2 minutes
      </p>
      <div className="w-auto">
        <Btn onClick={onStart} className="px-12">
          Let's do this
        </Btn>
      </div>
    </div>
  );
}
