import { useNavigate } from 'react-router-dom';
import { Btn } from '../../../components/brand/Btn';

export function TransitionScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-brand-cream font-sans-brand animate-fade-up">
      <div className="text-4xl mb-5" aria-hidden="true">
        🎉
      </div>
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
        Nicely done
      </p>
      <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text m-0 mb-3 max-w-sm">
        That's the hard part done.
      </h1>
      <p className="font-sans-brand text-[15px] text-brand-text-muted m-0 mb-10 leading-relaxed max-w-xs">
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
