interface DotsProps {
  current: number;
  total: number;
  className?: string;
}

export function Dots({ current, total, className = '' }: DotsProps) {
  return (
    <div className={`flex gap-2 justify-center py-4 ${className}`}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i <= current;
        const isCurrent = i === current;
        return (
          <div
            key={i}
            data-dot
            data-active={active}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isCurrent ? 'w-8' : 'w-1.5'
            } ${active ? 'bg-brand-sage' : 'bg-brand-border'}`}
          />
        );
      })}
    </div>
  );
}
