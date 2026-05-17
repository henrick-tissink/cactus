import { useState } from 'react';

interface WhyDisclosureProps {
  reason: string;
}

export function WhyDisclosure({ reason }: WhyDisclosureProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 font-sans-brand font-semibold text-[13px] text-brand-sage hover:text-brand-accent-ink cursor-pointer bg-transparent border-none p-0 focus-visible:outline-none focus-visible:underline underline-offset-4 transition-colors"
      >
        <span
          className={`inline-block transition-transform text-[10px] ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
        Why are we asking this?
      </button>
      {open && (
        <div className="mt-2 bg-brand-sage-soft/60 border-l-[3px] border-brand-sage rounded-r-xl px-4 py-3 animate-fade-up">
          <p className="font-sans-brand text-[13px] text-brand-text-muted m-0 leading-relaxed">
            {reason}
          </p>
        </div>
      )}
    </div>
  );
}
