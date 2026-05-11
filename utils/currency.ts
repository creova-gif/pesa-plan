export type Region = 'TZ' | 'KE' | 'UG' | 'RW' | 'BI';

export const REGION_CONFIG: Record<Region, {
  currency: string; symbol: string; flag: string;
  nameEn: string; nameSw: string;
  locale: string;
}> = {
  TZ: { currency: 'TZS', symbol: 'TSh', flag: '🇹🇿', nameEn: 'Tanzania',  nameSw: 'Tanzania',  locale: 'sw-TZ' },
  KE: { currency: 'KES', symbol: 'KSh', flag: '🇰🇪', nameEn: 'Kenya',     nameSw: 'Kenya',     locale: 'en-KE' },
  UG: { currency: 'UGX', symbol: 'USh', flag: '🇺🇬', nameEn: 'Uganda',    nameSw: 'Uganda',    locale: 'en-UG' },
  RW: { currency: 'RWF', symbol: 'RF',  flag: '🇷🇼', nameEn: 'Rwanda',    nameSw: 'Rwanda',    locale: 'en-RW' },
  BI: { currency: 'BIF', symbol: 'FBu', flag: '🇧🇮', nameEn: 'Burundi',   nameSw: 'Burundi',   locale: 'fr-BI' },
};

export function formatCurrency(amount: number, region: Region): string {
  const { symbol } = REGION_CONFIG[region];
  if (amount >= 1_000_000) return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
  return `${symbol} ${Math.round(amount).toLocaleString()}`;
}
