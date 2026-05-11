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
    colorClass: 'text-cactus-sage',
    bgClass: 'bg-cactus-needs-bg',
  },
  {
    value: 'debt',
    icon: '🔓',
    label: 'Reduce my debt',
    subtitle: 'Pay off credit cards, loans, or any other debt faster',
    colorClass: 'text-cactus-prickly',
    bgClass: 'bg-cactus-goals-bg',
  },
  {
    value: 'emergency',
    icon: '🛟',
    label: 'Build an emergency fund',
    subtitle: "Create a safety net for life's surprises",
    colorClass: 'text-cactus-desert',
    bgClass: 'bg-cactus-wants-bg',
  },
];
