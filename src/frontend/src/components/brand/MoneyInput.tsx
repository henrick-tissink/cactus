interface MoneyInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
}: MoneyInputProps) {
  return (
    <div
      className={`flex items-center gap-1 bg-brand-surface border-2 border-brand-border rounded-2xl px-4 py-4 focus-within:border-brand-sage transition-colors ${className}`}
    >
      <span className="font-display font-medium text-2xl text-brand-text-faint">R</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        className="flex-1 border-none bg-transparent outline-none font-display font-medium text-2xl text-brand-text tabular-lining placeholder:text-brand-text-faint/70"
      />
    </div>
  );
}
