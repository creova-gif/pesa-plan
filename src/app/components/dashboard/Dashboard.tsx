import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle, MinusCircle, Target, TrendingUp, History,
  Settings, Home, Flame, ChevronRight, Trash2, Search,
  Sparkles, RotateCcw, AlertTriangle, Bell,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis,
} from 'recharts';
import { useApp } from '@/app/App';
import { t } from '@/app/utils/translations';
import { formatCurrency, REGION_CONFIG } from '@/app/utils/currency';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { AddTransactionDialog } from './AddTransactionDialog';
import { GoalsView } from './GoalsView';
import { HistoryView } from './HistoryView';
import { InsightsView } from './InsightsView';
import { SettingsView } from './SettingsView';
import { DailySummaryDialog } from './DailySummaryDialog';
import { QuickAddButton } from './QuickAddButton';
import { OfflineIndicator } from './OfflineIndicator';
import { SpendingNudge } from './SpendingNudge';
import { ExitExperience } from './ExitExperience';
import { BudgetLimitsSheet } from './BudgetLimitsSheet';
import { EditTransactionDialog } from './EditTransactionDialog';
import { AIAssistant } from './AIAssistant';
import { NotificationCenter } from './NotificationCenter';
import type { Transaction } from '@/app/App';

type ActiveView = 'dashboard' | 'goals' | 'history' | 'insights' | 'settings';
type Period = 'today' | 'week' | 'month';

// ── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const start = prevRef.current;
    const diff = target - start;
    const startTime = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) timerRef.current = setTimeout(tick, 16);
      else prevRef.current = target;
    };
    tick();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [target, duration]);
  return value;
}

const tabs: { id: ActiveView; icon: typeof Home; sw: string; en: string }[] = [
  { id: 'dashboard', icon: Home, sw: t('home', 'sw'), en: t('home', 'en') },
  { id: 'goals', icon: Target, sw: t('goals', 'sw'), en: t('goals', 'en') },
  { id: 'history', icon: History, sw: t('history', 'sw'), en: t('history', 'en') },
  { id: 'insights', icon: TrendingUp, sw: t('insights', 'sw'), en: t('insights', 'en') },
  { id: 'settings', icon: Settings, sw: t('settings', 'sw'), en: t('settings', 'en') },
];

function getGreeting(userType: string | null, lang: 'sw' | 'en') {
  const map: Record<string, 'greetStudent' | 'greetBiashara' | 'greetInformal' | 'greetFamily'> = {
    student: 'greetStudent', biashara: 'greetBiashara',
    informal: 'greetInformal', family: 'greetFamily',
  };
  const key = map[userType ?? ''];
  return key ? t(key, lang) : t('greetDefault', lang);
}

const PIE_COLORS = ['#10b981','#0d9488','#06b6d4','#f97316','#8b5cf6','#3b82f6','#ec4899','#f59e0b'];
const TAB_ORDER: ActiveView[] = ['dashboard', 'goals', 'history', 'insights', 'settings'];

// ── Natural language query parser ───────────────────────────────────────────
function nlSearch(query: string, transactions: Transaction[]): Transaction[] {
  if (!query.trim()) return transactions;
  const q = query.toLowerCase();
  // extract keywords (strip common filler words)
  const stopWords = ['show','me','my','all','the','expenses','expense','income','spending','for','in','on','of','and'];
  const keywords = q.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));
  if (!keywords.length) return transactions;
  return transactions.filter(tx => {
    const haystack = [tx.category, tx.notes ?? '', tx.source, tx.type].join(' ').toLowerCase();
    return keywords.some(k => haystack.includes(k));
  });
}

export function Dashboard() {
  const { state, shouldShowDailySummary, updateGoal, deleteTransaction, getCategorySpending } = useApp();
  const lang = state.language;

  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showGoalContribute, setShowGoalContribute] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartRef = useRef<number>(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showBudgetLimits, setShowBudgetLimits] = useState(false);
  const [prefilledCategory, setPrefilledCategory] = useState<string | undefined>(undefined);
  const [prefilledAmount, setPrefilledAmount] = useState<number | undefined>(undefined);

  // ── Tab swipe navigation ──────────────────────────────────────────────────
  const mainTouchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onMainTouchStart = (e: React.TouchEvent) => {
    mainTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onMainTouchEnd = (e: React.TouchEvent) => {
    if (swipedId !== null) return; // don't trigger when swiping a transaction row
    const dx = e.changedTouches[0].clientX - mainTouchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - mainTouchStartRef.current.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2.5) {
      const idx = TAB_ORDER.indexOf(activeView);
      if (dx < 0 && idx < TAB_ORDER.length - 1) {
        setActiveView(TAB_ORDER[idx + 1]);
        if (navigator.vibrate) navigator.vibrate(8);
      } else if (dx > 0 && idx > 0) {
        setActiveView(TAB_ORDER[idx - 1]);
        if (navigator.vibrate) navigator.vibrate(8);
      }
    }
  };

  useEffect(() => {
    if (shouldShowDailySummary() && state.transactions.length > 0) {
      const t = setTimeout(() => setShowDailySummary(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  const fmt = (n: number) => formatCurrency(n, state.region);
  const fmtK = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n.toString();

  // ── Period stats ─────────────────────────────────────────────────────────
  const periodStats = useMemo(() => {
    const now = new Date();
    let start: Date;
    if (period === 'today') {
      start = new Date(now.toDateString());
    } else if (period === 'week') {
      start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const filtered = state.transactions.filter(tx => tx.date >= start);
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, left: income - expenses };
  }, [state.transactions, period]);

  const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;
  const animatedBalance = useCountUp(totalBalance);
  const animatedExpenses = useCountUp(periodStats.expenses);

  // ── Week-over-week comparison ─────────────────────────────────────────────
  const weekOverWeek = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisWeekSpend = state.transactions
      .filter(tx => tx.type === 'expense' && tx.date >= thisWeekStart)
      .reduce((s, t) => s + t.amount, 0);
    const lastWeekSpend = state.transactions
      .filter(tx => tx.type === 'expense' && tx.date >= lastWeekStart && tx.date < thisWeekStart)
      .reduce((s, t) => s + t.amount, 0);
    if (lastWeekSpend === 0) return null;
    const delta = Math.round(((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100);
    return { delta, thisWeekSpend, lastWeekSpend };
  }, [state.transactions]);

  // ── Monthly progress (always month view for the arc) ─────────────────────
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const filtered = state.transactions.filter(tx => tx.date >= start);
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const budget = income > 0 ? income : 500_000;
    const pct = Math.min((expenses / budget) * 100, 100);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const dailyBudget = budget / daysInMonth;
    const expectedSpend = dailyBudget * dayOfMonth;
    const onTrack = expenses <= expectedSpend * 1.1;
    return { income, expenses, budget, pct, onTrack, expectedSpend };
  }, [state.transactions]);

  // ── Pie chart data ───────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const spending = getCategorySpending();
    return Object.entries(spending)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([cat, val]) => ({ name: cat, value: val }));
  }, [state.transactions]);

  // ── Budget alerts ────────────────────────────────────────────────────────
  const budgetAlerts = useMemo(() => {
    const spending = getCategorySpending();
    return Object.entries(state.categoryBudgets)
      .map(([cat, budget]) => ({ cat, budget, spent: spending[cat] ?? 0, pct: Math.round(((spending[cat] ?? 0) / budget) * 100) }))
      .filter(a => a.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
  }, [state.transactions, state.categoryBudgets]);

  // ── 7-day trend ──────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      const spent = state.transactions
        .filter(tx => tx.type === 'expense' && tx.date.toDateString() === ds)
        .reduce((s, tx) => s + tx.amount, 0);
      return { day: days[d.getDay()], spent };
    });
  }, [state.transactions]);

  // ── Active goal ──────────────────────────────────────────────────────────
  const activeGoal = state.goals.find(g => !g.completed) ?? state.goals[0];
  const goalPct = activeGoal ? Math.min((activeGoal.current / activeGoal.target) * 100, 100) : 0;

  const avgDailyIncome = useMemo(() => {
    const incomeTx = state.transactions.filter(t => t.type === 'income');
    if (incomeTx.length === 0) return 5000;
    const days = new Set(incomeTx.map(t => t.date.toDateString())).size;
    const total = incomeTx.reduce((s, t) => s + t.amount, 0);
    return Math.round((total / Math.max(days, 1)) / 500) * 500;
  }, [state.transactions]);

  // ── NL-filtered transactions ─────────────────────────────────────────────
  const filteredTx = useMemo(() =>
    nlSearch(searchQuery, state.transactions).slice(0, searchQuery ? 20 : 5),
    [searchQuery, state.transactions]);

  // ── Swipe handlers ───────────────────────────────────────────────────────
  const onTxTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; };
  const onTxTouchEnd = (e: React.TouchEvent, tx: Transaction) => {
    const delta = e.changedTouches[0].clientX - touchStartRef.current;
    if (delta < -70) setSwipedId(tx.id);
    else if (delta > 70) { setEditingTx(tx); setSwipedId(null); }
    else if (Math.abs(delta) < 10) {
      if (swipedId === tx.id) setSwipedId(null);
      else setEditingTx(tx);
    }
  };

  const handleDeleteTx = (tx: Transaction) => {
    if (confirmDeleteId === tx.id) {
      if (confirmDeleteTimerRef.current) clearTimeout(confirmDeleteTimerRef.current);
      deleteTransaction(tx.id); setSwipedId(null); setConfirmDeleteId(null);
      if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    } else {
      setConfirmDeleteId(tx.id);
      if (confirmDeleteTimerRef.current) clearTimeout(confirmDeleteTimerRef.current);
      confirmDeleteTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  // ── Arc math for monthly progress ────────────────────────────────────────
  const arcR = 52;
  const arcCirc = 2 * Math.PI * arcR;
  const arcPct = Math.min(monthlyStats.pct, 100);
  const arcDash = (arcPct / 100) * arcCirc * 0.75;
  const arcGap = arcCirc - arcDash;
  const monthSaved = Math.max(0, monthlyStats.income - monthlyStats.expenses);
  const arcColor = monthlyStats.pct >= 100 ? '#ef4444' : monthlyStats.pct >= 80 ? '#f97316' : monthlyStats.pct >= 60 ? '#eab308' : '#10b981';
  const hasMonthlyData = monthlyStats.income > 0 || monthlyStats.expenses > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#f4f3ef' }}>
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={onMainTouchStart}
        onTouchEnd={onMainTouchEnd}
      >
        <AnimatePresence mode="wait">

          {/* ══════════════ HOME VIEW ══════════════ */}
          {activeView === 'dashboard' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* ── Hero Header ── */}
              <div className="relative px-5 pt-14 pb-28 overflow-hidden" style={{ background: '#0b1a0d' }}>

                {/* Top row: greeting + streak + notifs */}
                <div className="flex items-start justify-between mb-5 relative">
                  <div>
                    <p className="text-white/45 text-xs mb-0.5">{getGreeting(state.userType, lang)}</p>
                    <p className="text-white font-bold" style={{ fontSize: '1.15rem' }}>
                      {state.userName ? state.userName : 'PesaPlan'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.streak > 0 && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="flex items-center gap-1 bg-orange-400 px-2.5 py-1 rounded-full"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span className="text-xs font-black">{state.streak}</span>
                      </motion.div>
                    )}
                    <NotificationCenter />
                  </div>
                </div>

                {/* Balance */}
                <div className="text-center mb-4 relative">
                  <p className="text-white/45 text-xs mb-1">{t('totalBalance', lang)}</p>
                  <motion.p
                    key={animatedBalance}
                    className="text-white font-black tracking-tight"
                    style={{ fontSize: '2.8rem' }}
                  >
                    {fmt(animatedBalance)}
                  </motion.p>
                  <div className="flex justify-center gap-3 mt-1 text-xs text-white/45">
                    <span>💵 {fmtK(state.cashBalance)}</span>
                    <span>·</span>
                    <span>📱 {fmtK(state.mobileMoneyBalance)}</span>
                    {state.bankBalance > 0 && <><span>·</span><span>🏦 {fmtK(state.bankBalance)}</span></>}
                  </div>
                </div>

                {/* Period selector */}
                <div className="flex justify-center mb-4">
                  <div className="flex rounded-2xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.10)' }}>
                    {(['today', 'week', 'month'] as Period[]).map(p => (
                      <motion.button
                        key={p} onClick={() => setPeriod(p)} whileTap={{ scale: 0.93 }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          period === p ? 'bg-white text-green-800 shadow' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {p === 'today' ? t('today', lang) : p === 'week' ? t('week', lang) : t('month', lang)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: t('income_label', lang), value: periodStats.income, color: 'text-green-300', sign: '+' },
                    { label: t('spent', lang), value: periodStats.expenses, color: 'text-red-300', sign: '-' },
                    { label: t('left', lang), value: Math.abs(periodStats.left), color: periodStats.left >= 0 ? 'text-white' : 'text-red-300', sign: periodStats.left >= 0 ? '' : '-' },
                  ].map(({ label, value, color, sign }) => (
                    <div key={label} className="rounded-2xl px-2 py-3 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-white/45 text-xs mb-1">{label}</p>
                      <p className={`text-sm font-bold ${color} tabular-nums`}>{sign}{fmtK(value)}</p>
                    </div>
                  ))}
                </div>

                {/* Week-over-week comparison badge */}
                {period === 'week' && weekOverWeek && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    <div className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                      weekOverWeek.delta <= 0
                        ? 'bg-emerald-400/30 text-emerald-100'
                        : 'bg-red-400/30 text-red-100'
                    }`}>
                      {weekOverWeek.delta <= 0 ? '↓' : '↑'}
                      {Math.abs(weekOverWeek.delta)}%{' '}
                      {t('vsLastWeek', lang)}
                    </div>
                  </motion.div>
                )}

                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setTxType('expense'); setShowAddTx(true); }}
                    className="rounded-2xl p-3 flex flex-col items-center gap-1.5 transition"
                    style={{ background: 'rgba(255,255,255,0.09)' }}
                  >
                    <MinusCircle className="w-5 h-5 text-red-300" />
                    <span className="text-xs text-white font-semibold">{t('addExpense', lang)}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setTxType('income'); setShowAddTx(true); }}
                    className="rounded-2xl p-3 flex flex-col items-center gap-1.5 transition"
                    style={{ background: 'rgba(255,255,255,0.09)' }}
                  >
                    <PlusCircle className="w-5 h-5 text-green-300" />
                    <span className="text-xs text-white font-semibold">{t('addIncome', lang)}</span>
                  </motion.button>
                  {/* Quick Repeat — repeats last expense */}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => {
                      const lastExpense = state.transactions.find(t => t.type === 'expense');
                      setTxType('expense');
                      if (lastExpense) {
                        setPrefilledCategory(lastExpense.category);
                        setPrefilledAmount(lastExpense.amount);
                      }
                      setShowAddTx(true);
                    }}
                    className="rounded-2xl p-3 flex flex-col items-center gap-1.5 transition"
                    style={{ background: 'rgba(255,255,255,0.09)' }}
                  >
                    <RotateCcw className="w-5 h-5 text-yellow-300" />
                    <span className="text-xs text-white font-semibold">
                      {t('repeat', lang)}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* ══ CARDS AREA ══ */}
              <div className="-mt-16 px-4 space-y-4 pb-32">

                {/* ── SEARCH BAR ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className={`bg-white rounded-2xl flex items-center gap-3 px-4 py-3 transition-all ${
                    searchFocused ? '' : ''
                  }`}
                  style={{ border: searchFocused ? '1px solid rgba(22,163,74,0.5)' : '1px solid #e8e7e4' }}
                >
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={t('searchPlaceholder', lang)}
                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-300"
                  />
                  <div className="flex items-center gap-1 rounded-full px-2 py-1 shrink-0" style={{ background: 'rgba(22,163,74,0.12)' }}>
                    <Sparkles className="w-3 h-3 text-green-600" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a' }}>AI</span>
                  </div>
                </motion.div>

                {/* ── MONTHLY PROGRESS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e7e4' }}
                >
                  {/* Tinted header strip */}
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0efec' }}>
                    <div>
                      <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-0.5">
                        {t('monthlySummary', lang)}
                      </p>
                      <p className="font-black text-gray-900 text-[0.95rem] leading-tight">
                        {t('spendingVsIncome', lang)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBudgetLimits(true)}
                      className="flex items-center gap-1.5 text-xs text-green-700 font-semibold px-3 py-1.5 rounded-full transition"
                      style={{ background: '#f0faf0', border: '1px solid #bbf7d0' }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {t('limits', lang)}
                    </button>
                  </div>

                  {/* Main body */}
                  <div className="px-5 pt-4 pb-3">
                    {!hasMonthlyData ? (
                      /* ── Empty state ── */
                      <div className="flex flex-col items-center py-4 gap-2 text-center">
                        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-1">
                          <TrendingUp className="w-7 h-7 text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-700">
                          {t('startLoggingToday', lang)}
                        </p>
                        <p className="text-xs text-gray-400 max-w-[200px]">
                          {t('addIncomeOrExpenses', lang)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5">
                        {/* SVG Arc */}
                        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                          <svg width="120" height="120" viewBox="0 0 120 120">
                            {/* Shadow circle for depth */}
                            <circle cx="60" cy="60" r={arcR} fill="none" stroke="#f1f5f9" strokeWidth="13"
                              strokeDasharray={`${arcCirc * 0.75} ${arcCirc * 0.25}`}
                              strokeDashoffset={arcCirc * 0.125}
                              strokeLinecap="round"
                            />
                            {/* Track */}
                            <circle cx="60" cy="60" r={arcR} fill="none" stroke="#e5e7eb" strokeWidth="10"
                              strokeDasharray={`${arcCirc * 0.75} ${arcCirc * 0.25}`}
                              strokeDashoffset={arcCirc * 0.125}
                              strokeLinecap="round"
                            />
                            {/* Fill */}
                            <motion.circle
                              cx="60" cy="60" r={arcR} fill="none"
                              stroke={arcColor}
                              strokeWidth="10"
                              strokeDasharray={`${arcDash} ${arcGap + arcCirc * 0.25}`}
                              strokeDashoffset={arcCirc * 0.125}
                              strokeLinecap="round"
                              initial={{ strokeDasharray: `0 ${arcCirc}` }}
                              animate={{ strokeDasharray: `${arcDash} ${arcGap + arcCirc * 0.25}` }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                            <p className="font-black tabular-nums text-[1.5rem] leading-none" style={{ color: arcColor }}>
                              {Math.round(arcPct)}%
                            </p>
                            <p className="text-[0.6rem] text-gray-400 font-medium">
                              {t('used', lang)}
                            </p>
                            {monthSaved > 0 && (
                              <p className="text-[0.6rem] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 mt-0.5">
                                +{fmtK(monthSaved)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats column */}
                        <div className="flex-1 space-y-2">
                          {/* Spent row with bar */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-gray-400 font-medium">{t('spent', lang)}</span>
                              <span className="text-[13px] font-bold text-gray-800">{fmtK(monthlyStats.expenses)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: arcColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(arcPct, 100)}%` }}
                                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                              />
                            </div>
                          </div>
                          {/* Income */}
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-400 font-medium">{t('income', lang)}</span>
                            <span className="text-[13px] font-bold text-emerald-600">+{fmtK(monthlyStats.income)}</span>
                          </div>
                          {/* Left */}
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-400 font-medium">{t('left', lang)}</span>
                            <span className={`text-[13px] font-bold ${monthlyStats.income - monthlyStats.expenses >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                              {monthlyStats.income - monthlyStats.expenses >= 0 ? '' : '-'}{fmtK(Math.abs(monthlyStats.income - monthlyStats.expenses))}
                            </span>
                          </div>
                          {/* Status badge */}
                          <div className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 ${
                            monthlyStats.onTrack
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            <span>{monthlyStats.onTrack ? '✅' : '⚠️'}</span>
                            <span>
                              {monthlyStats.onTrack ? t('onTrack', lang) : t('spendingAbovePace', lang)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 7-day sparkline */}
                  {hasMonthlyData && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          {t('sevenDayTrend', lang)}
                        </p>
                      </div>
                      <ResponsiveContainer width="100%" height={52}>
                        <AreaChart data={trendData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '6px 10px' }}
                            formatter={(v: number) => [fmtK(v), t('spent', lang)]}
                          />
                          <Area type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2} fill="url(#trendGrad)" dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>

                {/* ── BUDGET ALERTS ── */}
                {budgetAlerts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e7e4' }}
                  >
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <p className="font-bold text-gray-900 text-sm">
                          {t('budgetAlerts', lang)}
                        </p>
                      </div>
                      <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {budgetAlerts.length}
                      </span>
                    </div>
                    <div className="px-5 pb-4 space-y-2.5">
                      {budgetAlerts.slice(0, 3).map(alert => (
                        <motion.div
                          key={alert.cat}
                          animate={alert.pct >= 100 ? { scale: [1, 1.01, 1] } : {}}
                          transition={alert.pct >= 100 ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
                          className={`rounded-2xl px-3.5 py-3 flex items-center gap-3 ${
                            alert.pct >= 100 ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'
                          }`}
                        >
                          <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.pct >= 100 ? 'text-red-500' : 'text-orange-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-semibold text-gray-800 truncate">{alert.cat}</span>
                              <span className={`text-xs font-black ml-2 ${alert.pct >= 100 ? 'text-red-600' : 'text-orange-600'}`}>{alert.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${alert.pct >= 100 ? 'bg-red-500' : 'bg-orange-400'}`}
                                style={{ width: `${Math.min(alert.pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {fmt(alert.spent)} / {fmt(alert.budget)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── CATEGORY PIE CHART ── */}
                {pieData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e7e4' }}
                  >
                    <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                          {t('spendingBreakdown', lang)}
                        </p>
                        <p className="font-black text-gray-900" style={{ fontSize: '1rem' }}>
                          {t('byCategory', lang)}
                        </p>
                      </div>
                      <button onClick={() => setActiveView('insights')} className="text-xs text-emerald-600 flex items-center gap-0.5">
                        {t('view', lang)}<ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 px-2 pb-4">
                      {/* Pie */}
                      <div style={{ width: 140, height: 140 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%" cy="50%"
                              innerRadius={36} outerRadius={58}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              formatter={(v: number) => [fmt(v)]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex-1 space-y-2 pr-2">
                        {pieData.map((d, i) => {
                          const total = pieData.reduce((s, x) => s + x.value, 0);
                          const pct = Math.round((d.value / total) * 100);
                          return (
                            <div key={d.name} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-xs text-gray-600 truncate flex-1">{d.name}</span>
                              <span className="text-xs font-bold text-gray-700 tabular-nums">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── SPENDING INSIGHT CARD ── */}
                {pieData.length > 0 && (() => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const top = pieData[0];
                  const topPct = Math.round((top.value / total) * 100);
                  const isHigh = topPct > 40;
                  const secondMsg = (() => {
                    if (pieData.length >= 2) {
                      const second = pieData[1];
                      const secondPct = Math.round((second.value / total) * 100);
                      return lang === 'sw'
                        ? ` ${second.name} inashika ${secondPct}%.`
                        : ` ${second.name} takes ${secondPct}%.`;
                    }
                    return '';
                  })();
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
                      className={`rounded-3xl px-5 py-4 border ${
                        isHigh
                          ? 'bg-amber-50 border-amber-100'
                          : 'bg-emerald-50 border-emerald-100'
                      }`}
                    >
                      <p className={`text-sm font-bold mb-1 ${isHigh ? 'text-amber-900' : 'text-emerald-900'}`}>
                        {isHigh ? '⚠️' : '✅'}{' '}
                        {t('spendingInsight', lang)}
                      </p>
                      <p className={`text-sm leading-relaxed ${isHigh ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {lang === 'sw'
                          ? `${topPct}% ya matumizi yako yanakwenda ${top.name}.${secondMsg}${isHigh ? ' Jaribu kupunguza kidogo.' : ' Uko vizuri!'}`
                          : `${topPct}% of your spending goes to ${top.name}.${secondMsg}${isHigh ? ' Consider cutting back a bit.' : " You're managing well!"}`
                        }
                      </p>
                    </motion.div>
                  );
                })()}

                {/* ── ACTIVE GOAL ── */}
                {activeGoal && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e7e4' }}
                  >
                    <div className="px-5 pt-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm truncate max-w-[160px]">{activeGoal.title}</span>
                          {activeGoal.completed && <span>🎉</span>}
                        </div>
                        <button onClick={() => setActiveView('goals')} className="text-xs text-purple-600 flex items-center gap-0.5">
                          {t('view', lang)}<ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="h-2.5 bg-purple-50 rounded-full overflow-hidden mb-1.5">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${goalPct}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{fmt(activeGoal.current)}</span>
                        <span className="font-bold text-purple-600">{goalPct.toFixed(0)}%</span>
                        <span>{fmt(activeGoal.target)}</span>
                      </div>
                      {!activeGoal.completed && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowGoalContribute(true)}
                          className="w-full mt-3 bg-purple-600 text-white rounded-2xl py-3 text-sm font-bold"
                        >
                          + {t('contributeNow', lang)}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── RECENT TRANSACTIONS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                  className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e7e4' }}
                >
                  <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <p className="font-black text-gray-900" style={{ fontSize: '1rem' }}>
                      {searchQuery
                        ? (lang === 'sw' ? `Matokeo ya "${searchQuery}"` : `Results for "${searchQuery}"`)
                        : t('recentTransactions', lang)}
                    </p>
                    {!searchQuery && state.transactions.length > 5 && (
                      <button onClick={() => setActiveView('history')} className="text-xs text-emerald-600 flex items-center gap-0.5">
                        {t('all', lang)}<ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {filteredTx.length === 0 ? (
                    <div className="px-5 pb-6 text-center">
                      {!searchQuery && state.transactions.length === 0 ? (
                        <div className="py-4">
                          <div className="text-4xl mb-3">💸</div>
                          <p className="text-sm font-semibold text-gray-500 mb-1">
                            {t('startTracking', lang)}
                          </p>
                          <p className="text-xs text-gray-400 mb-4">
                            {t('tapToBegin', lang)}
                          </p>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setTxType('expense'); setShowAddTx(true); }}
                            className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: '#16a34a' }}
                          >
                            {t('addFirstEntry', lang)}
                          </motion.button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 py-4">
                          {searchQuery
                            ? t('noResultsFound', lang)
                            : t('noTransactions', lang)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-300 text-center pb-1">{t('swipeHint', lang)}</p>
                      {filteredTx.map((tx, idx) => (
                        <div key={tx.id} className="relative overflow-hidden">
                          <AnimatePresence>
                            {swipedId === tx.id && (
                              <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute right-0 top-0 h-full flex"
                              >
                                <button
                                  onClick={() => handleDeleteTx(tx)}
                                  aria-label={confirmDeleteId === tx.id ? 'Confirm delete' : 'Delete transaction'}
                                  className={`text-white px-5 h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                                    confirmDeleteId === tx.id ? 'bg-red-700' : 'bg-red-500'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="text-xs font-semibold">
                                    {confirmDeleteId === tx.id ? (lang === 'sw' ? 'Thibitisha?' : 'Confirm?') : t('delete', lang)}
                                  </span>
                                </button>
                                <button
                                  onClick={() => { setEditingTx(tx); setSwipedId(null); }}
                                  className="bg-blue-500 text-white px-4 h-full flex flex-col items-center justify-center gap-0.5"
                                >
                                  <span className="text-lg">✏️</span>
                                  <span className="text-xs font-semibold">{t('edit', lang)}</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.div
                            animate={{ x: swipedId === tx.id ? -116 : 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onTouchStart={e => onTxTouchStart(e)}
                            onTouchEnd={e => onTxTouchEnd(e, tx)}
                            onClick={() => { if (swipedId === tx.id) setSwipedId(null); else setEditingTx(tx); }}
                            className={`flex items-center justify-between px-5 py-3.5 bg-white cursor-pointer hover:bg-gray-50 transition ${
                              idx < filteredTx.length - 1 ? 'border-b border-gray-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                                tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                              }`}>
                                {getCategoryIcon(tx.category)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{tx.category}</p>
                                <p className="text-xs text-gray-400">
                                  {tx.source.toUpperCase()}{tx.notes ? ` · ${tx.notes}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                              </p>
                              <p className="text-xs text-gray-300">
                                {tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* ── AI INSIGHT BANNER ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  className="rounded-2xl p-5 text-white relative overflow-hidden"
                  style={{ background: '#0b1a0d', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.2)' }}>
                      <Sparkles className="w-4 h-4" style={{ color: '#4ade80' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm text-white">PesaPlan AI</p>
                        <span className="rounded px-1.5 py-0.5 font-semibold text-green-300" style={{ fontSize: '0.6rem', background: 'rgba(22,163,74,0.2)' }}>AI</span>
                      </div>
                      <p className="text-white/55 leading-relaxed" style={{ fontSize: '0.82rem' }}>
                        {state.transactions.length === 0
                          ? (lang === 'sw' ? 'Karibu! Anza kurekodi matumizi yako leo kwa kubonyeza "Matumizi" hapo juu.' : 'Welcome! Start tracking your spending by tapping "Expense" above.')
                          : periodStats.expenses > periodStats.income && periodStats.income > 0
                            ? (lang === 'sw' ? `⚠️ Unatumia zaidi ya unavyopata. Pata mapato zaidi au punguza matumizi ya ${pieData[0]?.name ?? 'chakula'}.` : `⚠️ Spending exceeds income. Try reducing ${pieData[0]?.name ?? 'food'} expenses.`)
                            : (lang === 'sw' ? `👍 Umeokolewa ${fmtK(Math.max(periodStats.left, 0))} wiki hii. Endelea hivyo!` : `👍 You've saved ${fmtK(Math.max(periodStats.left, 0))} so far. Keep it up!`)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('pesaplan:open-ai'))}
                    className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition text-center text-white/60"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    {t('askAssistantMore', lang)}
                  </button>
                </motion.div>

              </div>
            </motion.div>
          )}

          {activeView === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GoalsView onBack={() => setActiveView('dashboard')} />
            </motion.div>
          )}
          {activeView === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HistoryView onBack={() => setActiveView('dashboard')} onEditTransaction={setEditingTx} />
            </motion.div>
          )}
          {activeView === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InsightsView onBack={() => setActiveView('dashboard')} />
            </motion.div>
          )}
          {activeView === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsView onBack={() => setActiveView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav
        role="navigation"
        aria-label={lang === 'sw' ? 'Urambazaji wa chini' : 'Bottom navigation'}
        className="grid grid-cols-5 z-30 shrink-0 safe-area-bottom-nav"
        style={{ background: '#ffffff', borderTop: '1px solid #ebebea', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map(({ id, icon: Icon, sw, en }) => {
          const active = activeView === id;
          return (
            <motion.button
              key={id}
              role="tab"
              aria-selected={active}
              aria-label={lang === 'sw' ? sw : en}
              onClick={() => { setActiveView(id); if (navigator.vibrate) navigator.vibrate(8); }}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center justify-center py-3 relative"
            >
              {active && (
                <motion.div
                  layoutId="navPill"
                  className="absolute inset-x-4 top-0 h-[2px] rounded-full"
                  style={{ background: '#16a34a' }}
                />
              )}
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl mb-0.5 transition-all ${active ? '' : ''}`}
                style={active ? { background: 'rgba(22,163,74,0.08)' } : {}}>
                <Icon className="w-5 h-5 transition-colors" style={{ color: active ? '#16a34a' : '#9ca3af' }} />
              </div>
              <span className="font-semibold transition-colors" style={{ fontSize: '0.63rem', color: active ? '#15803d' : '#9ca3af' }}>
                {lang === 'sw' ? sw : en}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* ── OVERLAYS ── */}
      <QuickAddButton />
      <OfflineIndicator />
      <SpendingNudge onAddExpense={() => { setTxType('expense'); setShowAddTx(true); }} />
      <ExitExperience />

      {showAddTx && (
        <AddTransactionDialog
          type={txType}
          onClose={() => {
            setShowAddTx(false);
            setPrefilledCategory(undefined);
            setPrefilledAmount(undefined);
          }}
          prefilledCategory={prefilledCategory}
          prefilledAmount={prefilledAmount}
        />
      )}
      {showDailySummary && <DailySummaryDialog onClose={() => setShowDailySummary(false)} />}
      {editingTx && <EditTransactionDialog transaction={editingTx} onClose={() => setEditingTx(null)} />}
      {showBudgetLimits && <BudgetLimitsSheet onClose={() => setShowBudgetLimits(false)} />}

      <AIAssistant />

      {/* ── Goal Contribute Sheet ── */}
      <AnimatePresence>
        {showGoalContribute && activeGoal && (
          <GoalContributeSheet
            goal={activeGoal}
            lang={lang}
            suggestedAmount={avgDailyIncome}
            onContribute={amount => { updateGoal(activeGoal.id, amount); setShowGoalContribute(false); }}
            onClose={() => setShowGoalContribute(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Goal Contribute Sheet ────────────────────────────────────────────────────
function GoalContributeSheet({
  goal, lang, suggestedAmount, onContribute, onClose,
}: {
  goal: { id: string; title: string; target: number; current: number };
  lang: 'sw' | 'en';
  suggestedAmount: number;
  onContribute: (amount: number) => void;
  onClose: () => void;
}) {
  const { state: appState } = useApp();
  const [amount, setAmount] = useState('');
  const regionCfg = REGION_CONFIG[appState.region];
  const quickAmounts = regionCfg.quickAmounts[3];
  const fmt = (n: number) => formatCurrency(n, appState.region);
  const remaining = goal.target - goal.current;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 z-50 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">{t('contributeToGoal', lang)}</h2>
        <p className="text-xs text-gray-500 mb-1">{goal.title}</p>
        <p className="text-xs text-purple-600 font-medium mb-4">
          {lang === 'sw' ? `Imebaki: ${fmt(remaining)}` : `Remaining: ${fmt(remaining)}`}
        </p>
        {suggestedAmount > 0 && (
          <button
            onClick={() => setAmount(suggestedAmount.toString())}
            className={`w-full mb-3 py-2 px-3 rounded-xl border-2 text-xs font-semibold transition flex items-center justify-between ${
              amount === suggestedAmount.toString()
                ? 'border-purple-600 bg-purple-50 text-purple-800'
                : 'border-dashed border-purple-300 text-purple-600 hover:bg-purple-50'
            }`}
          >
            <span>💡 {t('suggestedToday', lang)}</span>
            <span>{fmt(suggestedAmount)}</span>
          </button>
        )}
        <div className="flex items-center border-2 border-emerald-500 rounded-2xl mb-4 overflow-hidden">
          <span className="px-3 text-sm text-gray-400 font-medium">{regionCfg.symbol}</span>
          <input
            type="number" placeholder="0" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 py-3 text-2xl font-black text-gray-900 outline-none"
            autoFocus
          />
        </div>
        <div className="flex gap-2 mb-5">
          {quickAmounts.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a.toString())}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                amount === a.toString() ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {fmt(a)}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { const n = parseFloat(amount); if (n > 0) onContribute(n); }}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full bg-purple-600 disabled:opacity-40 text-white rounded-2xl py-4 font-black transition"
        >
          {t('saveNow', lang)}
        </motion.button>
      </motion.div>
    </>
  );
}
