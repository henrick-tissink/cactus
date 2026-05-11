import { useNavigate } from 'react-router-dom';
import { Btn } from '../../../components/brand/Btn';

export function TransitionScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <div className="text-5xl mb-4" aria-hidden="true">
        🎉
      </div>
      <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal m-0 mb-2">
        Nice one! That's the hard part done.
      </h1>
      <p className="font-cactus text-base text-cactus-charcoal/60 font-medium m-0 mb-9 leading-relaxed max-w-xs">
        Now let's set up your account so we can save your progress and start building your Spending
        Plan.
      </p>
      <div className="w-auto">
        <Btn onClick={() => navigate('/register')} className="px-12">
          Create my account
        </Btn>
      </div>
    </div>
  );
}
