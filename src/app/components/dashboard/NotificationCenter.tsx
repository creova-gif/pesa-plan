import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, AlertTriangle, CheckCircle, TrendingUp, Target, Flame, RefreshCw } from 'lucide-react';
import { useApp } from '@/app/App';
import { t } from '@/app/utils/translations';
import { formatCurrency } from '@/app/utils/currency';
import { detectRecurring } from '@/app/utils/recurringDetect';

/** Risk 2 — Notification System (in-app computed alerts) */

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info' | 'urgent';
  icon: typeof Bell;
  title: { sw: string; en: string };
  body: { sw: string; en: string };
  action?: { sw: string; en: string };
}

export function NotificationCenter() {
  const { state, dismissNotification } = useApp();
  const lang = state.language;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('maokoto:open-notifications', handler);
    return () => window.removeEventListener('maokoto:open-notifications', handler);
  }, []);

  const fmt = (n: number) => formatCurrency(n, state.region);

  const dismissed = state.dismissedNotifications ?? [];

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    const now = new Date();
    const today = now.toDateString();

    // ── 1: Over-budget categories ──
    const byCategory: Record<string, number> = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    Object.entries(state.categoryBudgets).forEach(([cat, limit]) => {
      const spent = byCategory[cat] || 0;
      if (spent > limit) {
        list.push({
          id: `over-budget-${cat}`,
          type: 'urgent',
          icon: AlertTriangle,
          title: { sw: `${cat} — Bajeti Imezidiwa`, en: `${cat} — Budget Exceeded` },
          body: {
            sw: `Umetumia ${fmt(spent)} dhidi ya bajeti ya ${fmt(limit)}. Punguza matumizi.`,
            en: `Spent ${fmt(spent)} vs budget of ${fmt(limit)}. Reduce spending.`,
          },
        });
      } else if (spent > limit * 0.85) {
        list.push({
          id: `near-budget-${cat}`,
          type: 'warning',
          icon: AlertTriangle,
          title: { sw: `${cat} — Bajeti Karibu Kumalizika`, en: `${cat} — Budget Nearly Full` },
          body: {
            sw: `Umetumia ${Math.round((spent / limit) * 100)}% ya bajeti yako ya ${cat}.`,
            en: `You've used ${Math.round((spent / limit) * 100)}% of your ${cat} budget.`,
          },
        });
      }
    });

    // ── 2: Streak reminder (no tx today) ──
    const hasLoggedToday = state.transactions.some(t => t.date.toDateString() === today);
    if (state.streak > 0 && !hasLoggedToday) {
      list.push({
        id: 'streak-reminder',
        type: 'info',
        icon: Flame,
        title: { sw: `🔥 Mfululizo Wako wa ${state.streak} Siku Uko Hatarini!`, en: `🔥 Your ${state.streak}-day streak is at risk!` },
        body: {
          sw: 'Bado hujarekodi muamala leo. Rekodi sasa ili kuendelea.',
          en: "You haven't logged a transaction today. Log one to keep your streak.",
        },
        action: { sw: 'Rekodi Muamala', en: 'Log Transaction' },
      });
    }

    // ── 3: Goal milestones ──
    state.goals.forEach(goal => {
      const pct = Math.round((goal.current / goal.target) * 100);
      for (const milestone of [25, 50, 75]) {
        if (pct >= milestone && pct < milestone + 5) {
          list.push({
            id: `goal-milestone-${goal.id}-${milestone}`,
            type: 'success',
            icon: Target,
            title: { sw: `🎯 ${milestone}% ya "${goal.title}"`, en: `🎯 ${milestone}% of "${goal.title}"` },
            body: {
              sw: `Hongera! Umefika ${milestone}% ya lengo lako. Endelea!`,
              en: `Congrats! You've hit ${milestone}% of your goal. Keep going!`,
            },
          });
        }
      }
      if (goal.completed) {
        list.push({
          id: `goal-done-${goal.id}`,
          type: 'success',
          icon: CheckCircle,
          title: { sw: `🎉 Lengo Limefanikiwa!`, en: `🎉 Goal Completed!` },
          body: {
            sw: `"${goal.title}" imekamilika — ${fmt(goal.target)}. Hongera sana!`,
            en: `"${goal.title}" completed — ${fmt(goal.target)}. Incredible work!`,
          },
        });
      }
    });

    // ── 4: Weekly report (on Mondays) ──
    if (now.getDay() === 1) { // Monday
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
      const lastWeekExpenses = state.transactions
        .filter(t => t.type === 'expense' && t.date >= weekStart)
        .reduce((s, t) => s + t.amount, 0);
      if (lastWeekExpenses > 0) {
        list.push({
          id: `weekly-report-${now.toISOString().split('T')[0]}`,
          type: 'info',
          icon: TrendingUp,
          title: { sw: '📋 Ripoti ya Wiki — Tayari', en: '📋 Weekly Report — Ready' },
          body: {
            sw: `Wiki iliyopita ulitumia ${fmt(lastWeekExpenses)}. Angalia maarifa.`,
            en: `Last week you spent ${fmt(lastWeekExpenses)}. Check your insights.`,
          },
          action: { sw: 'Ona Maarifa', en: 'View Insights' },
        });
      }
    }

    // ── 5: Low balance warning ──
    const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;
    const avgDaily = byCategory['Chakula'] || byCategory['Food']
      ? (byCategory['Chakula'] || byCategory['Food']) / 30
      : 5000;
    if (totalBalance > 0 && totalBalance < avgDaily * 3) {
      list.push({
        id: 'low-balance',
        type: 'urgent',
        icon: AlertTriangle,
        title: { sw: '⚠️ Bakaa Ndogo — Tahadhari', en: '⚠️ Low Balance — Warning' },
        body: {
          sw: `Bakaa yako ya ${fmt(totalBalance)} inaweza kukwisha hivi karibuni.`,
          en: `Your balance of ${fmt(totalBalance)} may run out soon.`,
        },
      });
    }

    // ── 6: Subscription / recurring bill due soon ──
    const upcomingBills = detectRecurring(state.transactions).filter(r => r.daysUntil >= 0 && r.daysUntil <= 7);
    upcomingBills.forEach(bill => {
      const label = bill.daysUntil === 0
        ? (lang === 'sw' ? 'Leo' : 'Today')
        : (lang === 'sw' ? `Siku ${bill.daysUntil}` : `${bill.daysUntil} day${bill.daysUntil === 1 ? '' : 's'}`);
      list.push({
        id: `bill-due-${bill.category}-${bill.nextDue.toISOString().split('T')[0]}`,
        type: bill.daysUntil <= 3 ? 'urgent' : 'warning',
        icon: RefreshCw,
        title: {
          sw: `${bill.category} — Inakuja (${label})`,
          en: `${bill.category} — Due ${label === 'Today' ? 'Today' : `in ${label}`}`,
        },
        body: {
          sw: `Malipo ya kawaida ya ~${fmt(bill.avgAmount)} inatarajiwa ${bill.daysUntil === 0 ? 'leo' : `ndani ya siku ${bill.daysUntil}`}.`,
          en: `Your regular ~${fmt(bill.avgAmount)} payment is expected ${bill.daysUntil === 0 ? 'today' : `in ${bill.daysUntil} day${bill.daysUntil === 1 ? '' : 's'}`}.`,
        },
      });
    });

    return list.filter(a => !dismissed.includes(a.id));
  }, [state, dismissed]);

  const unreadCount = alerts.length;

  const typeConfig = {
    urgent: { bg: 'bg-red-50 border-red-200', icon: 'text-red-500', dot: 'bg-red-500' },
    warning: { bg: 'bg-orange-50 border-orange-200', icon: 'text-orange-500', dot: 'bg-orange-500' },
    success: { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-500', dot: 'bg-emerald-500' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-500', dot: 'bg-blue-500' },
  };

  return (
    <>
      {/* Notification sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <h2 className="text-base font-bold text-gray-900">
                    {t('notifications', lang)}
                  </h2>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Alerts list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500">
                      {t('noNotifications', lang)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('allCaughtUp', lang)}
                    </p>
                  </div>
                ) : (
                  alerts.map((alert, i) => {
                    const cfg = typeConfig[alert.type];
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`relative flex items-start gap-3 p-3 rounded-2xl border ${cfg.bg}`}
                      >
                        <div className={`p-1.5 rounded-full bg-white shrink-0`}>
                          <alert.icon className={`w-4 h-4 ${cfg.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900">{alert.title[lang]}</p>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.body[lang]}</p>
                          {alert.action && (
                            <button className={`mt-1.5 text-xs font-semibold ${cfg.icon}`}>
                              {alert.action[lang]} →
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => dismissNotification(alert.id)}
                          className="shrink-0 p-1 hover:bg-white/70 rounded-full"
                        >
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {alerts.length > 0 && (
                <div className="px-4 pb-6 pt-2 shrink-0">
                  <button
                    onClick={() => { alerts.forEach(a => dismissNotification(a.id)); setOpen(false); }}
                    className="w-full py-3 text-sm text-gray-500 border-2 border-gray-200 rounded-2xl font-medium"
                  >
                    {t('dismissAll', lang)}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}