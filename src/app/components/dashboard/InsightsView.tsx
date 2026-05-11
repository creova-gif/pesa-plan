import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Lightbulb, Smartphone, AlertCircle } from 'lucide-react';
import { useApp } from '@/app/App';
import { t } from '@/app/utils/translations';
import { formatCurrency as fmtCurrency } from '@/app/utils/currency';
import { SpendingHeatmap } from './SpendingHeatmap';
import { FinancialEducation } from './FinancialEducation';
import { SavingsChallenge } from './SavingsChallenge';
import { SmartBudgetBuilder } from './SmartBudgetBuilder';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
} from 'recharts';

interface InsightsViewProps {
  onBack: () => void;
}

// Correct Swahili day abbreviations
const DAY_LABELS = {
  sw: ['Jpl', 'Jtt', 'Jnn', 'Jtn', 'Alh', 'Iju', 'Jms'], // Sun–Sat
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export function InsightsView({ onBack }: InsightsViewProps) {
  const { state, getCategorySpending } = useApp();
  const lang = state.language;

  const formatCurrency = (amount: number) => fmtCurrency(amount, state.region);

  // ── Real 7-day data computed from actual transactions ──
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const dayTx = state.transactions.filter(tx => tx.date.toDateString() === dateStr);
    const income = dayTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expenses = dayTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return { day: DAY_LABELS[lang][date.getDay()], income, expenses };
  });

  const hasWeeklyData = weeklyData.some(d => d.income > 0 || d.expenses > 0);

  // ── Category breakdown ──
  const categorySpending = getCategorySpending();
  const pieData = Object.entries(categorySpending).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  // ── AI-style insights (derived from real data) ──
  const totalExpenses = Object.values(categorySpending).reduce((s, v) => s + v, 0);
  const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0];
  const topCategoryPct = topCategory && totalExpenses > 0
    ? ((topCategory[1] / totalExpenses) * 100).toFixed(0)
    : '0';

  const todayExpenses = state.transactions
    .filter(t => t.type === 'expense' && t.date.toDateString() === new Date().toDateString())
    .reduce((s, t) => s + t.amount, 0);

  const weeklyExpenses = weeklyData.reduce((s, d) => s + d.expenses, 0);
  const avgDailyExpense = weeklyExpenses / 7;
  const savingPotential = Math.round(avgDailyExpense * 0.1);

  // Insights cards (real data-aware)
  const insights = [
    topCategory && {
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      title: t('highestSpending', lang),
      text: lang === 'sw'
        ? `${topCategory[0]} ni ${topCategoryPct}% ya matumizi yako yote – ${formatCurrency(topCategory[1])}.`
        : `${topCategory[0]} is ${topCategoryPct}% of your total spending – ${formatCurrency(topCategory[1])}.`,
    },
    avgDailyExpense > 0 && {
      icon: Lightbulb,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      title: t('savingsTip', lang),
      text: lang === 'sw'
        ? `Wastani wako ni ${formatCurrency(Math.round(avgDailyExpense))} kwa siku. Hifadhi 10% = ${formatCurrency(savingPotential)}/siku!`
        : `Your daily average is ${formatCurrency(Math.round(avgDailyExpense))}. Save 10% = ${formatCurrency(savingPotential)}/day!`,
    },
    {
      icon: Smartphone,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      title: t('dataPlans', lang),
      text: lang === 'sw'
        ? 'Kwa data, fikiria kununua bundles wikendi — unaokoa zaidi!'
        : 'For data, consider buying bundles on weekends — you save more!',
    },
  ].filter(Boolean) as NonNullable<(typeof insights)[number]>[];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f3ef' }}>
      {/* Header */}
      <div className="text-white px-6 pb-6 min-safe-top" style={{ background: '#0b1a0d' }}>
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{t('insights', lang)}</h1>
        </div>
        <p className="text-sm opacity-80 ml-14">
          {lang === 'sw'
            ? `${state.transactions.length} muamala umechambuliwa`
            : `${state.transactions.length} transactions analysed`}
        </p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* No Data State */}
        {state.transactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #e8e7e4' }}
          >
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {t('addTransactionsPrompt', lang)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t('insightsWillAppear', lang)}
            </p>
          </motion.div>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-3 text-gray-900">
              {t('aiInsights', lang)}
            </h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e7e4' }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${insight.bg} p-2 rounded-full shrink-0`}>
                      <insight.icon className={`w-5 h-5 ${insight.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{insight.title}</h3>
                      <p className="text-sm text-gray-600">{insight.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Trends - real data */}
        <div>
          <h2 className="text-base font-bold mb-3 text-gray-900">
            {t('weeklyTrends', lang)}
          </h2>
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e7e4' }}>
            {hasWeeklyData ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="income" fill="#10b981" name={t('income', lang)} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name={t('expense', lang)} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                {t('addTransactionsForChart', lang)}
              </div>
            )}
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                <span className="text-xs text-gray-600">{t('income', lang)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                <span className="text-xs text-gray-600">{t('expense', lang)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🌡️ Spending Heatmap */}
        <SpendingHeatmap />

        {/* ── Weekly Report Card (FIX 4) ── */}
        {(() => {
          const thisWeekStart = new Date();
          thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
          thisWeekStart.setHours(0, 0, 0, 0);
          const lastWeekStart = new Date(thisWeekStart);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);
          const lastWeekEnd = new Date(thisWeekStart);

          const thisWeekTx = state.transactions.filter(tx => tx.date >= thisWeekStart);
          const lastWeekTx = state.transactions.filter(tx => tx.date >= lastWeekStart && tx.date < lastWeekEnd);

          const thisIncome = thisWeekTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const thisSpent = thisWeekTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const thisSaved = thisIncome - thisSpent;

          const lastSpent = lastWeekTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const spendDiff = lastSpent > 0 ? ((thisSpent - lastSpent) / lastSpent) * 100 : null;

          if (thisWeekTx.length === 0) return null;
          return (
            <div>
              <h2 className="text-base font-bold mb-3 text-gray-900">
                {t('thisWeeksReport', lang)}
              </h2>
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e7e4' }}>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {[
                    { label: t('income', lang), value: formatCurrency(thisIncome), color: 'text-emerald-600' },
                    { label: t('spent', lang), value: formatCurrency(thisSpent), color: 'text-red-600' },
                    { label: t('saved', lang), value: formatCurrency(Math.max(0, thisSaved)), color: 'text-blue-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {spendDiff !== null && (
                  <div className={`px-4 py-2 text-xs font-medium text-center border-t border-gray-100 ${
                    spendDiff > 0 ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50'
                  }`}>
                    {spendDiff > 0
                      ? `📈 ${t('spent', lang)} ${Math.abs(spendDiff).toFixed(0)}% ${t('spentMoreLastWeek', lang)}`
                      : `📉 ${t('spent', lang)} ${Math.abs(spendDiff).toFixed(0)}% ${t('spentLessLastWeek', lang)} ✓`}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── 🔮 Predictive Spending Intelligence ── */}
        {state.transactions.length >= 3 && (() => {
          const categorySpending = getCategorySpending();
          const now = new Date();
          const dayOfMonth = now.getDate();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const daysLeft = daysInMonth - dayOfMonth;

          const predictions = Object.entries(categorySpending)
            .map(([cat, spent]) => {
              const dailyRate = spent / Math.max(dayOfMonth, 1);
              const projected = spent + dailyRate * daysLeft;
              const budget = state.categoryBudgets[cat];
              const budgetPct = budget ? (projected / budget) * 100 : null;
              const usualAmount = state.transactions
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((s, t, _, arr) => s + t.amount / arr.length, 0);
              return { cat, spent, dailyRate, projected, budget, budgetPct, usualAmount };
            })
            .filter(p => p.dailyRate > 0)
            .sort((a, b) => (b.budgetPct ?? 0) - (a.budgetPct ?? 0))
            .slice(0, 4);

          if (predictions.length === 0) return null;

          return (
            <div>
              <h2 className="text-base font-bold mb-3 text-gray-900">
                {t('predictiveIntelligence', lang)}
              </h2>
              <div className="space-y-3">
                {predictions.map(p => {
                  const isOverBudget = p.budgetPct !== null && p.budgetPct > 100;
                  const isNearBudget = p.budgetPct !== null && p.budgetPct >= 80;
                  const isSafe = !isOverBudget && !isNearBudget;

                  let bg = 'bg-blue-50 border-blue-200';
                  let emoji = '📊';
                  let text = '';

                  if (isOverBudget) {
                    bg = 'bg-red-50 border-red-200';
                    emoji = '🚨';
                    text = lang === 'sw'
                      ? `${p.cat}: utazidi bajeti (${formatCurrency(Math.round(p.projected))}) mwezi huu.`
                      : `${p.cat}: projected to exceed budget (${formatCurrency(Math.round(p.projected))}) this month.`;
                  } else if (isNearBudget) {
                    bg = 'bg-orange-50 border-orange-200';
                    emoji = '⚠️';
                    text = lang === 'sw'
                      ? `${p.cat}: umekaribia kikomo (${Math.round(p.budgetPct!)}% kwa mwendo huu).`
                      : `${p.cat}: on pace to reach ${Math.round(p.budgetPct!)}% of budget.`;
                  } else if (p.usualAmount > 0) {
                    bg = 'bg-blue-50 border-blue-200';
                    emoji = '💡';
                    text = lang === 'sw'
                      ? `Kawaida unatumia ~${formatCurrency(Math.round(p.usualAmount))} kwa ${p.cat}.`
                      : `You usually spend ~${formatCurrency(Math.round(p.usualAmount))} on ${p.cat}.`;
                  } else {
                    bg = 'bg-emerald-50 border-emerald-200';
                    emoji = '✅';
                    text = lang === 'sw'
                      ? `${p.cat}: uko sawa kwa mwezi huu.`
                      : `${p.cat}: you're on track this month.`;
                  }

                  return (
                    <motion.div
                      key={p.cat}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-2xl p-3.5 border flex items-start gap-3 ${bg}`}
                    >
                      <span className="text-xl shrink-0">{emoji}</span>
                      <p className="text-sm text-gray-800">{text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── 📚 Financial Education — Roadmap Feature 6 ── */}
        <div>
          <h2 className="text-base font-bold mb-3 text-gray-900">
            {t('financialEducation', lang)}
          </h2>
          <FinancialEducation />
        </div>

        {/* ── 🏆 Savings Challenges — Roadmap Feature 7 ── */}
        <div>
          <SavingsChallenge />
        </div>

        {/* Category Breakdown */}
        {pieData.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-3 text-gray-900">
              {t('categoryBreakdown', lang)}
            </h2>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e7e4' }}>
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.slice(0, 8)} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RechartsPieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600">{entry.name}: {formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Budget Suggestions ── */}
        <div>
          <h2 className="text-base font-bold mb-3 text-gray-900">
            {t('budgetSuggestions', lang)}
          </h2>
          <SmartBudgetBuilder />
        </div>

        {/* Summary Stats */}
        {state.transactions.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-3 text-gray-900">
              {t('summary', lang)}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e7e4' }}>
                <p className="text-xs text-gray-500 mb-1">
                  {t('totalTransactions', lang)}
                </p>
                <p className="text-xl font-bold text-gray-900">{state.transactions.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e8e7e4' }}>
                <p className="text-xs text-gray-500 mb-1">
                  {t('dailyAverage', lang)}
                </p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(Math.round(avgDailyExpense))}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}