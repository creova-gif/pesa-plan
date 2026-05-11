import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, PieChart, Layers, Sprout, Wallet,
  Bell, Plus, ChevronRight, Trash2,
  AlertTriangle, TrendingUp, TrendingDown,
  Settings, Sparkles, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Tooltip,
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
import { OfflineIndicator } from './OfflineIndicator';
import { SpendingNudge } from './SpendingNudge';
import { BudgetLimitsSheet } from './BudgetLimitsSheet';
import { EditTransactionDialog } from './EditTransactionDialog';
import { AIAssistant } from './AIAssistant';
import { NotificationCenter } from './NotificationCenter';
import { SavingsChallenge } from './SavingsChallenge';
import { NetWorthCard } from './NetWorthCard';
import { FinancialEducation } from './FinancialEducation';
import { FinancialHealthScore } from './FinancialHealthScore';
import { SpendingHeatmap } from './SpendingHeatmap';
import { CashflowForecast } from './CashflowForecast';
import type { Transaction } from '@/app/App';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveTab = 'home' | 'budget' | 'savings' | 'invest' | 'wallet';
type Period = 'today' | 'week' | 'month';

const TAB_ORDER: ActiveTab[] = ['home', 'budget', 'savings', 'invest', 'wallet'];

// ─── Count-up animation ───────────────────────────────────────────────────────
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

// ─── Shared primitives ────────────────────────────────────────────────────────
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium" style={{ color: '#4D4845' }}>{label}</p>
      {sub && <p className="text-xs" style={{ color: '#928F8B' }}>{sub}</p>}
    </div>
  );
}

function Pill({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#4D4845' : '#F6F6F4',
        color: active ? '#fff' : '#4D4845',
        border: 'none',
        borderRadius: 999,
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'Geist, sans-serif',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        border: '1px solid #F4F4F2',
        borderRadius: 16,
      }}
    >
      {children}
    </div>
  );
}

function StripeProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  const over = value > max;
  return (
    <div
      style={{
        height: 8,
        width: '100%',
        borderRadius: 999,
        background: '#F4F4F2',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pct}%`,
          borderRadius: 999,
          background: over ? '#F55D3E' : 'linear-gradient(90deg, #FD8240, #F55D3E)',
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

// ─── Top Navigation ───────────────────────────────────────────────────────────
function TopNav({
  title,
  onBell,
  onAvatar,
  bellDot,
  userName,
}: {
  title: string;
  onBell: () => void;
  onAvatar?: () => void;
  bellDot?: boolean;
  userName?: string;
}) {
  const initials = userName ? userName.charAt(0).toUpperCase() : '✦';
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: '#fff',
        borderBottom: '1px solid #F4F4F2',
      }}
      className="safe-area-top"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          height: 56,
        }}
      >
        <button
          onClick={onAvatar}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#4E886F',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'Geist, sans-serif',
          }}
        >
          {initials}
        </button>
        <p
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#4D4845',
            fontFamily: 'Geist, sans-serif',
          }}
        >
          {title}
        </p>
        <button
          onClick={onBell}
          style={{
            position: 'relative',
            padding: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Bell size={22} color="#4D4845" strokeWidth={1.8} />
          {bellDot && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 8,
                height: 8,
                background: '#F55D3E',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
const NAV_ITEMS: {
  id: ActiveTab;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  en: string;
  sw: string;
}[] = [
  { id: 'home',    Icon: Home,     en: 'Home',    sw: 'Nyumbani' },
  { id: 'budget',  Icon: PieChart, en: 'Budget',  sw: 'Bajeti'   },
  { id: 'savings', Icon: Layers,   en: 'Savings', sw: 'Akiba'    },
  { id: 'invest',  Icon: Sprout,   en: 'Invest',  sw: 'Wekeza'   },
  { id: 'wallet',  Icon: Wallet,   en: 'Wallet',  sw: 'Mkoba'    },
];

function BottomNav({
  active,
  onChange,
  lang,
}: {
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
  lang: 'en' | 'sw';
}) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
        background: '#fff',
        borderTop: '1px solid #F4F4F2',
      }}
      className="safe-area-bottom-nav"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 8px',
        }}
      >
        {NAV_ITEMS.map(({ id, Icon, en, sw }) => {
          const isActive = active === id;
          const color = isActive ? '#4D4845' : '#A6A4A0';
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon size={22} strokeWidth={1.8} color={color} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color,
                  fontFamily: 'Geist, sans-serif',
                }}
              >
                {lang === 'sw' ? sw : en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────
function HomeTab({
  onAddIncome,
  onAddExpense,
  onSettings,
}: {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onSettings: () => void;
}) {
  const { state, deleteTransaction, updateGoal } = useApp();
  const { language: lang, transactions, goals, streak } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance - state.loanBalance;
  const animBalance = useCountUp(totalBalance);

  const todayStr = new Date().toDateString();
  const todayIncome = transactions
    .filter(t => t.type === 'income' && t.date.toDateString() === todayStr)
    .reduce((s, t) => s + t.amount, 0);
  const todayExpense = transactions
    .filter(t => t.type === 'expense' && t.date.toDateString() === todayStr)
    .reduce((s, t) => s + t.amount, 0);

  const recent = transactions.slice(0, 5);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteTap(id: string) {
    if (confirmDeleteId === id) {
      deleteTransaction(id);
      setConfirmDeleteId(null);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    } else {
      setConfirmDeleteId(id);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 2500);
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (lang === 'sw') return h < 12 ? 'Habari za asubuhi' : h < 17 ? 'Habari za mchana' : 'Habari za jioni';
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{greeting}</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
            {state.userName || (lang === 'sw' ? 'Karibu' : 'Welcome back')}
          </p>
        </div>
        {streak > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#FFF4EE',
              borderRadius: 999,
              padding: '6px 12px',
            }}
          >
            <Flame size={14} color="#FD8240" />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#FD8240', fontFamily: 'Geist, sans-serif' }}>
              {streak} {lang === 'sw' ? 'siku' : 'day streak'}
            </span>
          </div>
        )}
      </div>

      {/* Balance card */}
      <MkCard>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Jumla ya Akaunti' : 'Wallet Balance'}
          </p>
          <p style={{ fontSize: 32, fontWeight: 400, color: '#4D4845', margin: '4px 0 16px', fontFamily: 'Geist, sans-serif' }}>
            {fmt(animBalance)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={lang === 'sw' ? 'Ingiza' : 'Fund'} onClick={onAddIncome} />
            <Pill label={lang === 'sw' ? 'Tuma' : 'Send'} onClick={onAddExpense} />
            <Pill label={lang === 'sw' ? 'Ripoti' : 'Report'} onClick={onSettings} />
          </div>
        </div>
      </MkCard>

      {/* Today stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MkCard>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingUp size={14} color="#215B44" />
              <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Leo Mapato' : "Today's Income"}
              </p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#215B44', fontFamily: 'Geist, sans-serif' }}>
              {fmt(todayIncome)}
            </p>
          </div>
        </MkCard>
        <MkCard>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingDown size={14} color="#C9362B" />
              <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Leo Matumizi' : "Today's Spend"}
              </p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#C9362B', fontFamily: 'Geist, sans-serif' }}>
              {fmt(todayExpense)}
            </p>
          </div>
        </MkCard>
      </div>

      {/* Active goals preview */}
      {goals.filter(g => !g.completed).length > 0 && (
        <div>
          <SectionHeader
            label={lang === 'sw' ? 'Malengo Yangu' : 'My Goals'}
            sub={lang === 'sw' ? 'Maendeleo ya sasa' : 'Current progress'}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {goals.filter(g => !g.completed).slice(0, 2).map(goal => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <MkCard key={goal.id}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: '#4E886F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          flexShrink: 0,
                        }}
                      >
                        {goal.emoji || '🎯'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {goal.title}
                        </p>
                        <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                          {Math.round(pct)}% {lang === 'sw' ? 'imekamilika' : 'complete'}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 400, color: '#4D4845', marginBottom: 12, fontFamily: 'Geist, sans-serif' }}>
                      {fmt(goal.target)}
                    </p>
                    <StripeProgressBar value={goal.current} max={goal.target} />
                    <p style={{ fontSize: 12, color: '#928F8B', marginTop: 6, fontFamily: 'Geist, sans-serif' }}>
                      {fmt(goal.current)} {lang === 'sw' ? 'imehifadhiwa' : 'saved'}
                    </p>
                  </div>
                </MkCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Miamala ya Hivi Karibuni' : 'Recent Transactions'}
          sub={`${transactions.length} ${lang === 'sw' ? 'jumla' : 'total'}`}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          {recent.length === 0 ? (
            <MkCard>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 24 }}>💸</p>
                <p style={{ fontSize: 14, color: '#928F8B', textAlign: 'center', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Hakuna miamala bado' : 'No transactions yet'}
                </p>
              </div>
            </MkCard>
          ) : (
            recent.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid #F4F4F2',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(tx.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.category}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{tx.source}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: tx.type === 'income' ? '#215B44' : '#C9362B', fontFamily: 'Geist, sans-serif' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                    {tx.date.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTap(tx.id)}
                  style={{
                    padding: 4,
                    background: confirmDeleteId === tx.id ? '#FEF2F2' : 'none',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: confirmDeleteId === tx.id ? '#C9362B' : '#A6A4A0',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        {transactions.length > 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <span
              style={{
                background: '#F6F6F4',
                color: '#4D4845',
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 999,
                fontFamily: 'Geist, sans-serif',
              }}
            >
              {lang === 'sw' ? 'Angalia zote' : 'See all'}
            </span>
          </div>
        )}
      </div>

      {/* Emergency mode info */}
      {state.emergencyMode && (
        <div
          style={{
            background: '#FFF4EE',
            border: '1px solid rgba(253,130,64,0.3)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <AlertTriangle size={18} color="#FD8240" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#FD8240', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Hali ya Dharura' : 'Emergency Mode On'}
            </p>
            <p style={{ fontSize: 12, color: '#928F8B', marginTop: 2, fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Matumizi muhimu tu yanaonyeshwa' : 'Only essential spending shown'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BUDGET TAB ───────────────────────────────────────────────────────────────
function BudgetTab({ onOpenBudgetLimits }: { onOpenBudgetLimits: () => void }) {
  const { state, getCategorySpending } = useApp();
  const { language: lang, transactions, categoryBudgets } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();
  const monthName = now.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'long' });

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const start = period === 'today' ? today : period === 'week' ? weekStart : monthStart;
    return transactions.filter(tx => tx.date >= start);
  }, [transactions, period]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBudget = Object.values(categoryBudgets).reduce((s, v) => s + v, 0) || totalIncome;
  const remaining = Math.max(totalBudget - totalExpense, 0);
  const cashflow = totalIncome - totalExpense;

  const categorySpend = useMemo(() => getCategorySpending(), [transactions]);
  const topCategories = Object.entries(categorySpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const cashflowData = useMemo(() => {
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short' });
      const mTxs = transactions.filter(
        tx => tx.date.getMonth() === d.getMonth() && tx.date.getFullYear() === d.getFullYear()
      );
      months.push({
        name: label,
        income: mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions, lang]);

  const recentExpenses = transactions.filter(t => t.type === 'expense').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {(['today', 'week', 'month'] as Period[]).map(p => (
          <Pill
            key={p}
            label={p === 'today' ? (lang === 'sw' ? 'Leo' : 'Today') : p === 'week' ? (lang === 'sw' ? 'Wiki' : 'Week') : monthName}
            active={period === p}
            onClick={() => setPeriod(p)}
          />
        ))}
        <button
          onClick={onOpenBudgetLimits}
          style={{
            marginLeft: 'auto',
            padding: 6,
            borderRadius: '50%',
            background: '#F6F6F4',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Settings size={14} color="#4D4845" />
        </button>
      </div>

      {/* Budget remaining */}
      <MkCard>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Bajeti Iliyobaki' : 'Budget Remaining'}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 0 12px' }}>
            <p style={{ fontSize: 32, fontWeight: 400, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
              {fmt(remaining)}
            </p>
            <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'iliyobaki' : 'left'}
            </p>
          </div>
          <StripeProgressBar value={totalExpense} max={totalBudget || 1} />
          <p style={{ fontSize: 12, color: '#928F8B', marginTop: 8, fontFamily: 'Geist, sans-serif' }}>
            {fmt(totalExpense)} / {fmt(totalBudget)} {lang === 'sw' ? 'imetumika' : 'spent'}
          </p>
        </div>
      </MkCard>

      {/* Spending insight chart */}
      {cashflowData.some(d => d.income > 0 || d.expense > 0) && (
        <MkCard>
          <div style={{ padding: 16 }}>
            <SectionHeader
              label={lang === 'sw' ? 'Mwenendo wa Matumizi' : 'Spending Insight'}
              sub={lang === 'sw' ? 'Ulinganisho wa miezi 6' : 'Last 6 months'}
            />
            <div style={{ marginTop: 12, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} barGap={2} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#928F8B' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="expense" fill="#F4F4F2" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="income" fill="#4E886F" radius={[3, 3, 0, 0]} />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F4F4F2' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </MkCard>
      )}

      {/* Expense categories */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionHeader
            label={lang === 'sw' ? 'Makundi ya Matumizi' : 'Expense Categories'}
            sub={lang === 'sw' ? 'Pesa yako inaenda wapi' : 'See where your money went'}
          />
          <button
            onClick={onOpenBudgetLimits}
            style={{
              fontSize: 12,
              color: '#928F8B',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            {lang === 'sw' ? 'Mipaka' : 'Set limits'} <ChevronRight size={12} />
          </button>
        </div>
        {topCategories.length === 0 ? (
          <MkCard>
            <div style={{ padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Hakuna data' : 'No expense data yet'}
              </p>
            </div>
          </MkCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topCategories.map(([cat, amount]) => {
              const budget = categoryBudgets[cat] || 0;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#F6F6F4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(cat)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat}
                      </p>
                      <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif', flexShrink: 0, marginLeft: 8 }}>
                        {fmt(amount)}{budget > 0 ? ` / ${fmt(budget)}` : ''}
                      </p>
                    </div>
                    <StripeProgressBar value={amount} max={budget || amount} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {topCategories.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button
              onClick={onOpenBudgetLimits}
              style={{
                background: '#F6F6F4',
                color: '#4D4845',
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Geist, sans-serif',
              }}
            >
              {lang === 'sw' ? 'Angalia zote' : 'See all'}
            </button>
          </div>
        )}
      </div>

      {/* Cash Flow */}
      <MkCard>
        <div style={{ padding: 16 }}>
          <SectionHeader
            label={lang === 'sw' ? 'Mtiririko wa Pesa' : 'Cash Flow'}
            sub={lang === 'sw' ? 'Jinsi pesa yako inavyosogea' : 'See how your money moved'}
          />
          <p style={{ fontSize: 24, fontWeight: 400, color: cashflow >= 0 ? '#215B44' : '#C9362B', margin: '8px 0 12px', fontFamily: 'Geist, sans-serif' }}>
            {cashflow >= 0 ? '+' : ''}{fmt(cashflow)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4E886F', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{lang === 'sw' ? 'Pesa Inayoingia' : 'Money In'}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#215B44', fontFamily: 'Geist, sans-serif' }}>{fmt(totalIncome)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FD8240', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{lang === 'sw' ? 'Pesa Inayotoka' : 'Money Out'}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#C9362B', fontFamily: 'Geist, sans-serif' }}>{fmt(totalExpense)}</span>
            </div>
          </div>
        </div>
      </MkCard>

      {/* Recent expenses */}
      {recentExpenses.length > 0 && (
        <div>
          <SectionHeader
            label={lang === 'sw' ? 'Miamala ya Hivi Karibuni' : 'Recent Transactions'}
            sub={`${transactions.length} ${lang === 'sw' ? 'jumla' : 'total'}`}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {recentExpenses.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid #F4F4F2',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(tx.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.category}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                    {tx.date.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#C9362B', flexShrink: 0, fontFamily: 'Geist, sans-serif' }}>
                  -{fmt(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <MkCard>
        <div style={{ padding: 16 }}>
          <SectionHeader
            label={lang === 'sw' ? 'Makala' : 'Articles'}
            sub={lang === 'sw' ? 'Jifunze misingi ya bajeti' : 'Learn the fundamentals of budgeting'}
          />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
            {[
              { en: 'Overspending', sw: 'Kutumia Kupita Kiasi', subEn: 'Guide to avoiding the habit of overspending', subSw: 'Mwongozo wa kuzuia tabia ya kutumia kupita kiasi' },
              { en: 'Budgeting', sw: 'Bajeti', subEn: 'How to successfully manage your financial budget', subSw: 'Jinsi ya kusimamia bajeti yako ya kifedha' },
            ].map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i === 0 ? '1px solid #F4F4F2' : 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(78,136,111,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  📖
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? a.sw : a.en}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lang === 'sw' ? a.subSw : a.subEn}
                  </p>
                </div>
                <ChevronRight size={14} color="#A6A4A0" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </MkCard>
    </div>
  );
}

// ─── SAVINGS TAB ──────────────────────────────────────────────────────────────
function SavingsTab({ onAddGoal }: { onAddGoal: () => void }) {
  const { state, updateGoal, deleteGoal } = useApp();
  const { language: lang, goals, roundUpEnabled, roundUpSavings } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>
      {/* Total savings */}
      <MkCard>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Jumla ya Akiba' : 'Total Savings'}
          </p>
          <p style={{ fontSize: 32, fontWeight: 400, color: '#4D4845', margin: '4px 0 16px', fontFamily: 'Geist, sans-serif' }}>
            {fmt(totalSaved)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={lang === 'sw' ? 'Ongeza' : 'Fund'} onClick={onAddGoal} />
            <Pill label={lang === 'sw' ? 'Toa' : 'Withdraw'} />
            {roundUpEnabled && <Pill label="Round-Up" />}
          </div>
        </div>
      </MkCard>

      {/* Round-up savings */}
      {roundUpEnabled && roundUpSavings > 0 && (
        <MkCard>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(78,136,111,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              🔄
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Akiba ya Round-Up' : 'Round-Up Savings'}
              </p>
              <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Jumla iliyohifadhiwa' : 'Total rounded up'}
              </p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#215B44', fontFamily: 'Geist, sans-serif' }}>
              +{fmt(roundUpSavings)}
            </p>
          </div>
        </MkCard>
      )}

      {/* Saving goals section */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Malengo ya Akiba' : 'Saving Goals'}
          sub={lang === 'sw' ? 'Tazama pesa yako inaenda wapi' : "See where you're putting your money"}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <MkCard>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <p style={{ fontSize: 32 }}>🎯</p>
                <p style={{ fontSize: 14, color: '#928F8B', textAlign: 'center', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Hakuna malengo bado. Ongeza lengo lako la kwanza!' : "No goals yet. Add your first goal!"}
                </p>
                <button
                  onClick={onAddGoal}
                  style={{
                    background: '#4E886F',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Geist, sans-serif',
                  }}
                >
                  {lang === 'sw' ? 'Ongeza Lengo' : 'Add Goal'}
                </button>
              </div>
            </MkCard>
          ) : (
            <>
              {activeGoals.map(goal => {
                const pct = Math.min((goal.current / goal.target) * 100, 100);
                return (
                  <MkCard key={goal.id}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4E886F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {goal.emoji || '🎯'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{goal.title}</p>
                          <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                            {Math.round(pct)}% {lang === 'sw' ? 'imekamilika' : 'complete'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#A6A4A0', flexShrink: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: 24, fontWeight: 400, color: '#4D4845', marginBottom: 12, fontFamily: 'Geist, sans-serif' }}>
                        {fmt(goal.target)}
                      </p>
                      <StripeProgressBar value={goal.current} max={goal.target} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                          {fmt(goal.current)} {lang === 'sw' ? 'imehifadhiwa' : 'saved'}
                        </p>
                        {goal.daysLeft != null && (
                          <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                            {goal.daysLeft} {lang === 'sw' ? 'siku zimebaki' : 'days left'}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => updateGoal(goal.id, 0)}
                          style={{ flex: 1, background: '#F6F6F4', color: '#4D4845', fontSize: 12, fontWeight: 500, padding: '8px 0', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}
                        >
                          {lang === 'sw' ? 'Weka Fedha' : 'Fund'}
                        </button>
                        <button style={{ background: '#F6F6F4', color: '#4D4845', fontSize: 12, fontWeight: 500, padding: '8px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}>
                          🔒 {lang === 'sw' ? 'Toa' : 'Withdraw'}
                        </button>
                      </div>
                    </div>
                  </MkCard>
                );
              })}
              {completedGoals.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: '#928F8B', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
                    {completedGoals.length} {lang === 'sw' ? 'lengo limekamilika' : 'goal(s) completed'} 🎉
                  </p>
                  {completedGoals.map(goal => (
                    <MkCard key={goal.id}>
                      <div style={{ padding: 16, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4E886F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                          {goal.emoji || '🎯'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', textDecoration: 'line-through', fontFamily: 'Geist, sans-serif' }}>{goal.title}</p>
                          <p style={{ fontSize: 12, color: '#215B44', fontFamily: 'Geist, sans-serif' }}>✓ {lang === 'sw' ? 'Imekamilika' : 'Completed'}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{fmt(goal.target)}</p>
                      </div>
                    </MkCard>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Savings challenges */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Changamoto za Akiba' : 'Savings Challenges'}
          sub={lang === 'sw' ? 'Ongeza akiba kwa changamoto za kila siku' : 'Boost savings with daily challenges'}
        />
        <div style={{ marginTop: 12 }}>
          <SavingsChallenge />
        </div>
      </div>
    </div>
  );
}

// ─── INVEST TAB ───────────────────────────────────────────────────────────────
function InvestTab() {
  const { state } = useApp();
  const { language: lang } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>
      {/* Portfolio value */}
      <MkCard>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Thamani ya Mali' : 'Portfolio Value'}
          </p>
          <p style={{ fontSize: 32, fontWeight: 400, color: '#4D4845', margin: '4px 0 4px', fontFamily: 'Geist, sans-serif' }}>
            {fmt(totalBalance)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4E886F', display: 'inline-block' }} />
            <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Akaunti zote' : 'All accounts combined'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill label={lang === 'sw' ? 'Wekeza' : 'Invest'} />
            <Pill label={lang === 'sw' ? 'Toa' : 'Withdraw'} />
          </div>
        </div>
      </MkCard>

      {/* Net worth */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Thamani Halisi' : 'Net Worth'}
          sub={lang === 'sw' ? 'Jumla ya mali yako' : 'Total assets minus liabilities'}
        />
        <div style={{ marginTop: 12 }}>
          <NetWorthCard />
        </div>
      </div>

      {/* Financial health score */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Alama ya Afya ya Kifedha' : 'Financial Health Score'}
        />
        <div style={{ marginTop: 12 }}>
          <FinancialHealthScore />
        </div>
      </div>

      {/* Spending heatmap */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Ramani ya Matumizi' : 'Spending Heatmap'}
          sub={lang === 'sw' ? 'Mwenendo wako wa matumizi' : 'Your spending pattern'}
        />
        <div style={{ marginTop: 12 }}>
          <SpendingHeatmap />
        </div>
      </div>

      {/* Cashflow forecast */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Utabiri wa Pesa' : 'Cashflow Forecast'}
          sub={lang === 'sw' ? 'Matarajio ya pesa yako' : 'Your money outlook'}
        />
        <div style={{ marginTop: 12 }}>
          <CashflowForecast />
        </div>
      </div>

      {/* Spending insights */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Maarifa ya Matumizi' : 'Spending Insights'}
        />
        <div style={{ marginTop: 12 }}>
          <InsightsView onBack={() => {}} />
        </div>
      </div>

      {/* Financial education */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Elimu ya Kifedha' : 'Financial Education'}
          sub={lang === 'sw' ? 'Jifunze zaidi kuhusu fedha' : 'Learn more about finance'}
        />
        <div style={{ marginTop: 12 }}>
          <FinancialEducation />
        </div>
      </div>
    </div>
  );
}

// ─── WALLET TAB ───────────────────────────────────────────────────────────────
function WalletTab({
  onAddIncome,
  onAddExpense,
  onSettings,
  onAI,
}: {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onSettings: () => void;
  onAI: () => void;
}) {
  const { state } = useApp();
  const { language: lang } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const walletTotal = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;

  const balances = [
    { label: lang === 'sw' ? 'Pesa Taslimu' : 'Cash',        amount: state.cashBalance,        emoji: '💵', color: '#215B44' },
    { label: lang === 'sw' ? 'Simu ya Mkononi' : 'M-Pesa',   amount: state.mobileMoneyBalance,  emoji: '📱', color: '#4E886F' },
    { label: lang === 'sw' ? 'Benki' : 'Bank',                amount: state.bankBalance,          emoji: '🏦', color: '#FD8240' },
    { label: lang === 'sw' ? 'Mkopo' : 'Loan',                amount: state.loanBalance,          emoji: '💳', color: '#C9362B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>
      {/* Wallet balance */}
      <MkCard>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Salio la Mkoba' : 'Wallet Balance'}
          </p>
          <p style={{ fontSize: 32, fontWeight: 400, color: '#4D4845', margin: '4px 0 16px', fontFamily: 'Geist, sans-serif' }}>
            {fmt(walletTotal)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={lang === 'sw' ? 'Ingiza' : 'Fund'} onClick={onAddIncome} />
            <Pill label={lang === 'sw' ? 'Tuma' : 'Send'} onClick={onAddExpense} />
            <Pill label={lang === 'sw' ? 'Pokea' : 'Receive'} />
          </div>
        </div>
      </MkCard>

      {/* Balance breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {balances.map(({ label, amount, emoji, color }) => (
          <MkCard key={label}>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</p>
              <p style={{ fontSize: 12, color: '#928F8B', marginBottom: 2, fontFamily: 'Geist, sans-serif' }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 500, color, fontFamily: 'Geist, sans-serif' }}>{fmt(amount)}</p>
            </div>
          </MkCard>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onAI}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F6F6F4',
            color: '#4D4845',
            fontSize: 14,
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
          }}
        >
          <Sparkles size={14} color="#FD8240" />
          {lang === 'sw' ? 'Msaidizi wa AI' : 'AI Assistant'}
        </button>
        <button
          onClick={onSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F6F6F4',
            color: '#4D4845',
            fontSize: 14,
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
          }}
        >
          <Settings size={14} />
          {lang === 'sw' ? 'Mipangilio' : 'Settings'}
        </button>
      </div>

      {/* Transaction history */}
      <div>
        <SectionHeader
          label={lang === 'sw' ? 'Historia ya Miamala' : 'Transaction History'}
          sub={lang === 'sw' ? 'Miamala yote' : 'All transactions'}
        />
        <div style={{ marginTop: 12 }}>
          <HistoryView onBack={() => {}} />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export function Dashboard() {
  const { state, shouldShowDailySummary, markDailySummaryShown, toggleEmergencyMode } = useApp();
  const lang = state.language;

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalsView, setShowGoalsView] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBudgetLimits, setShowBudgetLimits] = useState(false);

  // Swipe navigation
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2.5) {
      const idx = TAB_ORDER.indexOf(activeTab);
      if (dx < 0 && idx < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[idx + 1]);
        if (navigator.vibrate) navigator.vibrate(8);
      } else if (dx > 0 && idx > 0) {
        setActiveTab(TAB_ORDER[idx - 1]);
        if (navigator.vibrate) navigator.vibrate(8);
      }
    }
  };

  // Daily summary on mount
  useEffect(() => {
    if (shouldShowDailySummary() && state.transactions.length > 0) {
      const timer = setTimeout(() => setShowDailySummary(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const tabTitles: Record<ActiveTab, { en: string; sw: string }> = {
    home:    { en: 'Home',    sw: 'Nyumbani' },
    budget:  { en: 'Budget',  sw: 'Bajeti'   },
    savings: { en: 'Savings', sw: 'Akiba'    },
    invest:  { en: 'Invest',  sw: 'Wekeza'   },
    wallet:  { en: 'Wallet',  sw: 'Mkoba'    },
  };

  function openAddExpense() { setTxType('expense'); setShowAddTx(true); }
  function openAddIncome()  { setTxType('income');  setShowAddTx(true); }

  // Full-screen overlays
  if (showSettings) {
    return (
      <div style={{ width: '100%', maxWidth: 448, minHeight: '100vh', background: '#fff' }}>
        <SettingsView onBack={() => setShowSettings(false)} />
      </div>
    );
  }
  if (showGoalsView) {
    return (
      <div style={{ width: '100%', maxWidth: 448, minHeight: '100vh', background: '#fff' }}>
        <GoalsView onBack={() => setShowGoalsView(false)} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 448,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F6F6F4',
        position: 'relative',
        overflow: 'hidden',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <OfflineIndicator />
      <SpendingNudge />

      {/* Top Nav */}
      <TopNav
        title={tabTitles[activeTab][lang]}
        onBell={() => setShowNotifications(true)}
        onAvatar={() => setShowSettings(true)}
        bellDot={true}
        userName={state.userName}
      />

      {/* Emergency mode bar */}
      {state.emergencyMode && (
        <div
          style={{
            background: '#FD8240',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="#fff" />
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 500, fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Hali ya Dharura' : 'Emergency Mode'}
            </span>
          </div>
          <button
            onClick={toggleEmergencyMode}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif', textDecoration: 'underline' }}
          >
            {lang === 'sw' ? 'Zima' : 'Disable'}
          </button>
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {activeTab === 'home' && (
              <HomeTab
                onAddIncome={openAddIncome}
                onAddExpense={openAddExpense}
                onSettings={() => setShowSettings(true)}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetTab onOpenBudgetLimits={() => setShowBudgetLimits(true)} />
            )}
            {activeTab === 'savings' && (
              <SavingsTab onAddGoal={() => setShowGoalsView(true)} />
            )}
            {activeTab === 'invest' && <InvestTab />}
            {activeTab === 'wallet' && (
              <WalletTab
                onAddIncome={openAddIncome}
                onAddExpense={openAddExpense}
                onSettings={() => setShowSettings(true)}
                onAI={() => setShowAI(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={openAddExpense}
        style={{
          position: 'fixed',
          bottom: 88,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#4E886F',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
          boxShadow: '0 4px 16px rgba(78,136,111,0.4)',
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </button>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onChange={setActiveTab} lang={lang} />

      {/* Dialogs */}
      {showAddTx && (
        <AddTransactionDialog
          open={showAddTx}
          defaultType={txType}
          onClose={() => setShowAddTx(false)}
        />
      )}
      {editingTx && (
        <EditTransactionDialog
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
      {showDailySummary && (
        <DailySummaryDialog
          open={showDailySummary}
          onClose={() => {
            setShowDailySummary(false);
            markDailySummaryShown();
          }}
        />
      )}
      {showBudgetLimits && (
        <BudgetLimitsSheet onClose={() => setShowBudgetLimits(false)} />
      )}
      {showAI && <AIAssistant />}
      {showNotifications && <NotificationCenter />}
    </div>
  );
}
