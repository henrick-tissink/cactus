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
    colorClass: 'text-cactus-sage',
    bgClass: 'bg-cactus-needs-bg',
    examples: 'Rent, groceries, transport, utilities, insurance, minimum debt payments',
  },
  {
    title: 'Wants',
    subtitle: 'The stuff that makes life fun',
    emoji: '🛍️',
    percent: 30,
    colorClass: 'text-cactus-desert',
    bgClass: 'bg-cactus-wants-bg',
    examples: 'Dining out, entertainment, subscriptions, shopping, hobbies',
  },
  {
    title: 'Goals',
    subtitle: 'The stuff that builds your future',
    emoji: '🎯',
    percent: 20,
    colorClass: 'text-cactus-prickly',
    bgClass: 'bg-cactus-goals-bg',
    examples: 'Emergency fund, extra debt payoff, savings targets, investments',
  },
];
