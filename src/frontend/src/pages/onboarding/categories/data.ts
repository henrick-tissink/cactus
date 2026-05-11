export interface CategoryDef {
  name: string;
  icon: string;
  bucket: 'needs' | 'wants';
}

export const defaultCategories: CategoryDef[] = [
  { name: 'Rent / Bond', icon: '🏠', bucket: 'needs' },
  { name: 'Groceries', icon: '🛒', bucket: 'needs' },
  { name: 'Transport', icon: '🚗', bucket: 'needs' },
  { name: 'Utilities', icon: '💡', bucket: 'needs' },
  { name: 'Insurance', icon: '🛡️', bucket: 'needs' },
  { name: 'Medical Aid', icon: '🏥', bucket: 'needs' },
  { name: 'Debt Minimum Payments', icon: '💸', bucket: 'needs' },
  { name: 'School Fees', icon: '🎒', bucket: 'needs' },
  { name: 'Dining Out', icon: '🍽️', bucket: 'wants' },
  { name: 'Entertainment', icon: '🎬', bucket: 'wants' },
  { name: 'Shopping', icon: '🛍️', bucket: 'wants' },
  { name: 'Subscriptions', icon: '📺', bucket: 'wants' },
  { name: 'Personal Care', icon: '💅', bucket: 'wants' },
  { name: 'Hobbies', icon: '🎨', bucket: 'wants' },
];

export const extraCategories: CategoryDef[] = [
  { name: 'Petrol', icon: '⛽', bucket: 'needs' },
  { name: 'Childcare', icon: '👶', bucket: 'needs' },
  { name: 'Stokvel', icon: '🤝', bucket: 'needs' },
  { name: 'Home Security', icon: '🔒', bucket: 'needs' },
  { name: 'Levies / Body Corp', icon: '🏢', bucket: 'needs' },
  { name: 'Fitness', icon: '🏋️', bucket: 'wants' },
  { name: 'Travel', icon: '✈️', bucket: 'wants' },
  { name: 'Pets', icon: '🐾', bucket: 'wants' },
  { name: 'Gifts', icon: '🎁', bucket: 'wants' },
  { name: 'Coffee & Snacks', icon: '☕', bucket: 'wants' },
  { name: 'Clothing', icon: '👕', bucket: 'wants' },
];
