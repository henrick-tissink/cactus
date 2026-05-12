export interface IncomeSourceType {
  id: string;
  label: string;
  icon: string;
}

export const incomeSourceTypes: IncomeSourceType[] = [
  { id: 'freelance', label: 'Freelance / Side hustle', icon: '💻' },
  { id: 'rental', label: 'Rental income', icon: '🏘️' },
  { id: 'investment', label: 'Investment returns', icon: '📈' },
  { id: 'support', label: 'Support / Maintenance', icon: '🤝' },
  { id: 'grant', label: 'Grant / Stipend', icon: '🎓' },
  { id: 'other', label: 'Other income', icon: '💵' },
];
