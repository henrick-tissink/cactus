export interface FrameworkCard {
  title: 'Needs' | 'Wants' | 'Goals';
  subtitle: string;
  emoji: string;
  percent: 50 | 30 | 20;
  /** Tailwind class for the percent text color */
  colorClass: string;
  /** Tailwind class for the card background */
  bgClass: string;
  examples: string;
}

export const frameworkCards: FrameworkCard[] = [
  {
    title: 'Needs',
    subtitle: 'The stuff that keeps life running',
    emoji: '🏠',
    percent: 50,
    colorClass: 'text-brand-sage',
    bgClass: 'bg-brand-sage-soft/50',
    examples: 'Rent, groceries, transport, utilities, insurance, minimum debt payments',
  },
  {
    title: 'Wants',
    subtitle: 'The stuff that makes life fun',
    emoji: '🛍️',
    percent: 30,
    colorClass: 'text-brand-terracotta',
    bgClass: 'bg-brand-terracotta-soft/60',
    examples: 'Dining out, entertainment, subscriptions, shopping, hobbies',
  },
  {
    title: 'Goals',
    subtitle: 'The stuff that builds your future',
    emoji: '🎯',
    percent: 20,
    colorClass: 'text-brand-accent-ink',
    bgClass: 'bg-brand-accent-ink/10',
    examples: 'Emergency fund, extra debt payoff, savings targets, investments',
  },
];
