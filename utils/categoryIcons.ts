const ICONS: Record<string, string> = {
  food: '🍔', food_drink: '🍔', restaurant: '🍽️', groceries: '🛒',
  transport: '🚗', travel: '✈️', fuel: '⛽',
  health: '💊', medical: '🏥', hospital: '🏥',
  education: '📚', school: '🎓', books: '📖',
  entertainment: '🎬', movies: '🎭', games: '🎮',
  shopping: '🛍️', clothes: '👗', electronics: '📱',
  utilities: '💡', electricity: '⚡', water: '💧', internet: '🌐',
  rent: '🏠', housing: '🏠',
  salary: '💼', income: '💰', business: '🏪',
  savings: '🏦', investment: '📈', bank: '🏦',
  mpesa: '📱', airtel: '📱', tigo: '📱',
  loan: '💳', debt: '💳',
  data: '📶', airtime: '📞',
  default: '💸',
};

export function getCategoryIcon(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, '_');
  return ICONS[key] || ICONS[category.toLowerCase()] || ICONS.default;
}
