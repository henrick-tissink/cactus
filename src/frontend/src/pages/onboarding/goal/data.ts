export type GoalPickValue = 'save' | 'debt' | 'emergency';

export interface GoalOption {
  value: GoalPickValue;
  icon: string;
  label: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
}

export const goalOptions: GoalOption[] = [
  {
    value: 'save',
    icon: '💰',
    label: 'Save more money',
    subtitle: 'Build savings, emergency fund, or save for something specific',
    colorClass: 'text-brand-sage',
    bgClass: 'bg-brand-sage-soft',
  },
  {
    value: 'debt',
    icon: '🔓',
    label: 'Reduce my debt',
    subtitle: 'Pay off credit cards, loans, or any other debt faster',
    colorClass: 'text-brand-accent-ink',
    bgClass: 'bg-brand-accent-ink/10',
  },
  {
    value: 'emergency',
    icon: '🛟',
    label: 'Build an emergency fund',
    subtitle: "Create a safety net for life's surprises",
    colorClass: 'text-brand-terracotta',
    bgClass: 'bg-brand-terracotta-soft',
  },
];
