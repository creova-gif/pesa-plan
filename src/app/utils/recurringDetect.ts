export interface RecurringItem {
  category: string;
  avgAmount: number;
  nextDue: Date;
  daysUntil: number;
  source: string;
  occurrences: number;
}

export function detectRecurring(
  transactions: Array<{ type: string; date: Date; category: string; amount: number; source: string }>
): RecurringItem[] {
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

  const byCategory: Record<string, { dates: Date[]; amounts: number[]; source: string }> = {};
  transactions
    .filter(t => t.type === 'expense' && t.date >= sixtyDaysAgo)
    .forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = { dates: [], amounts: [], source: t.source };
      byCategory[t.category].dates.push(t.date);
      byCategory[t.category].amounts.push(t.amount);
      byCategory[t.category].source = t.source;
    });

  const items: RecurringItem[] = [];
  for (const [cat, data] of Object.entries(byCategory)) {
    if (data.dates.length < 2) continue;
    const sorted = [...data.dates].sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000);
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    if (avgInterval < 4 || avgInterval > 45) continue;

    const avgAmount = Math.round(data.amounts.reduce((s, v) => s + v, 0) / data.amounts.length);
    const lastDate = sorted[sorted.length - 1];
    const nextDue = new Date(lastDate.getTime() + avgInterval * 86400000);
    const daysUntil = Math.round((nextDue.getTime() - now.getTime()) / 86400000);

    items.push({ category: cat, avgAmount, nextDue, daysUntil, source: data.source, occurrences: data.dates.length });
  }

  return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 8);
}
