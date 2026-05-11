import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, PieChart, Layers, Sprout, Wallet,
  Bell, Plus, ChevronRight, Trash2,
  AlertTriangle, TrendingUp, TrendingDown,
  Settings, Sparkles, Flame, CreditCard, Users, X, Check, UserPlus, Split,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, YAxis, CartesianGrid,
} from 'recharts';
import { useApp } from '@/app/App';
import { t } from '@/app/utils/translations';
import { formatCurrency, REGION_CONFIG } from '@/app/utils/currency';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { BrandIcon } from '@/app/utils/brandLogos';
import { AddTransactionDialog } from './AddTransactionDialog';
import { GoalsView } from './GoalsView';
import { HistoryView } from './HistoryView';
import { InsightsView } from './InsightsView';
import { SettingsView } from './SettingsView';
import { BudgetCategoryView } from './BudgetCategoryView';
import { GoalDetailView } from './GoalDetailView';
import { InvestDetailView } from './InvestDetailView';
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
import { InsightOfDay } from './InsightOfDay';
import { SmartBudgetBuilder } from './SmartBudgetBuilder';
import { BudgetHealthBars } from './BudgetHealthBars';
import { LocalBenchmarks } from './LocalBenchmarks';
import { GrowthShareCard } from './GrowthShareCard';
import { ExitExperience } from './ExitExperience';
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
        <motion.button
          onClick={onAvatar}
          whileTap={{ scale: 0.88 }}
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
        </motion.button>
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
        <motion.button
          onClick={onBell}
          whileTap={{ scale: 0.85 }}
          style={{
            position: 'relative',
            padding: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Bell size={22} color="#4D4845" strokeWidth={1.8} />
          <AnimatePresence>
            {bellDot && (
              <motion.span
                key="bell-dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="mk-ring-pulse"
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  background: '#F55D3E',
                  borderRadius: '50%',
                  display: 'block',
                }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
type NavLabel = Record<import('@/app/App').Language, string>;
const NAV_ITEMS: {
  id: ActiveTab;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  labels: NavLabel;
}[] = [
  { id: 'home',    Icon: Home,     labels: { en: 'Home',      sw: 'Nyumbani', fr: 'Accueil',   ar: 'الرئيسية', pt: 'Início'   } },
  { id: 'budget',  Icon: PieChart, labels: { en: 'Budget',    sw: 'Bajeti',   fr: 'Budget',    ar: 'الميزانية', pt: 'Orçamento' } },
  { id: 'savings', Icon: Layers,   labels: { en: 'Savings',   sw: 'Akiba',    fr: 'Épargne',   ar: 'المدخرات',  pt: 'Poupança' } },
  { id: 'invest',  Icon: Sprout,   labels: { en: 'Invest',    sw: 'Wekeza',   fr: 'Investir',  ar: 'استثمار',   pt: 'Investir' } },
  { id: 'wallet',  Icon: Wallet,   labels: { en: 'Wallet',    sw: 'Mkoba',    fr: 'Portefeuille', ar: 'محفظة',  pt: 'Carteira' } },
];

function BottomNav({
  active,
  onChange,
  lang,
}: {
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
  lang: import('@/app/App').Language;
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
          padding: '8px 4px',
        }}
      >
        {NAV_ITEMS.map(({ id, Icon, labels }) => {
          const isActive = active === id;
          const color = isActive ? '#FD8240' : '#A6A4A0';
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.88 }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Sliding orange pill indicator above active tab */}
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: '50%',
                    x: '-50%',
                    width: 24,
                    height: 3,
                    borderRadius: 999,
                    background: '#FD8240',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.span
                animate={{
                  scale: isActive ? 1.12 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{ display: 'flex' }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} color={color} />
              </motion.span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 500,
                  color,
                  fontFamily: 'Geist, sans-serif',
                  letterSpacing: isActive ? '-0.01em' : 0,
                  transition: 'color 0.15s, font-weight 0.15s',
                }}
              >
                {labels[lang] ?? labels.en}
              </span>
            </motion.button>
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
  onInsights,
  onHistory,
  onTxSelect,
}: {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onSettings: () => void;
  onInsights: () => void;
  onHistory: () => void;
  onTxSelect: (tx: Transaction) => void;
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
          <motion.div
            className="mk-streak-pulse"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
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
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FD8240', fontFamily: 'Geist, sans-serif' }}>
              {streak} {lang === 'sw' ? 'siku' : 'day streak'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Insight of the day */}
      <InsightOfDay />

      {/* Balance card — premium dark hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          background: 'linear-gradient(145deg, #0F2419 0%, #1A3D2E 45%, #245E42 100%)',
          padding: '22px 22px 20px',
          boxShadow: '0 12px 40px rgba(15,36,25,0.4)',
        }}
      >
        {/* Radial glow top-right */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(92,199,160,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Dot-grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '18px 18px', pointerEvents: 'none',
        }} />

        {/* Label + balance */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Geist, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          {lang === 'sw' ? 'Jumla ya Akaunti' : lang === 'fr' ? 'Solde total' : lang === 'ar' ? 'الرصيد الإجمالي' : lang === 'pt' ? 'Saldo total' : 'Total Balance'}
        </p>
        <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: 'Geist, sans-serif', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 18 }}>
          {fmt(animBalance)}
        </p>

        {/* Today row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(92,199,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={12} color="#5CC7A0" />
            </div>
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'Geist, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'sw' ? 'Mapato leo' : "Today's in"}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#5CC7A0', fontFamily: 'Geist, sans-serif' }}>+{fmt(todayIncome)}</p>
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(249,99,71,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={12} color="#F96347" />
            </div>
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'Geist, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'sw' ? 'Matumizi leo' : "Today's out"}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F96347', fontFamily: 'Geist, sans-serif' }}>-{fmt(todayExpense)}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: lang === 'sw' ? 'Ingiza' : lang === 'fr' ? 'Ajouter' : lang === 'ar' ? 'أضف' : lang === 'pt' ? 'Adicionar' : 'Fund', fn: onAddIncome },
            { label: lang === 'sw' ? 'Tuma' : lang === 'fr' ? 'Envoyer' : lang === 'ar' ? 'أرسل' : lang === 'pt' ? 'Enviar' : 'Send', fn: onAddExpense },
            { label: lang === 'sw' ? 'Maarifa' : lang === 'fr' ? 'Insights' : lang === 'ar' ? 'رؤى' : lang === 'pt' ? 'Insights' : 'Insights', fn: onInsights },
          ].map(({ label, fn }) => (
            <motion.button
              key={label}
              onClick={fn}
              whileTap={{ scale: 0.92 }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 12,
                padding: '9px 4px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'Geist, sans-serif',
                backdropFilter: 'blur(4px)',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Net worth breakdown */}
      <NetWorthCard />

      {/* Cashflow forecast */}
      <CashflowForecast />

      {/* Spending heatmap */}
      <SpendingHeatmap />

      {/* Active goals preview */}
      {goals.filter(g => !g.completed).length > 0 && (
        <div>
          <SectionHeader
            label={lang === 'sw' ? 'Malengo Yangu' : 'My Goals'}
            sub={lang === 'sw' ? 'Maendeleo ya sasa' : 'Current progress'}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {goals.filter(g => !g.completed).slice(0, 2).map((goal, idx) => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.22, ease: 'easeOut' }}
                >
                <MkCard>
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
                </motion.div>
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
            recent.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.2, ease: 'easeOut' }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <button
                  onClick={() => onTxSelect(tx)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', minWidth: 0 }}
                >
                <BrandIcon
                  category={tx.category}
                  notes={tx.notes}
                  size={40}
                  fallback={
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
                  }
                />
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
                </button>
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
              </motion.div>
            ))
          )}
        </div>
        {transactions.length > 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button
              onClick={onHistory}
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

      {/* Growth / share card */}
      <GrowthShareCard />

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
function BudgetTab({
  onOpenBudgetLimits,
  onCategorySelect,
  onTxSelect,
  onHistory,
  onOpenLesson,
}: {
  onOpenBudgetLimits: () => void;
  onCategorySelect: (cat: string) => void;
  onTxSelect: (tx: Transaction) => void;
  onHistory: () => void;
  onOpenLesson: (lessonId: string) => void;
}) {
  const { state, getCategorySpending } = useApp();
  const { language: lang, transactions, categoryBudgets } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);
  const [period, setPeriod] = useState<Period>('month');
  const [showNewBudgetType, setShowNewBudgetType] = useState(false);

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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowNewBudgetType(true)}
            style={{ padding: '6px 12px', borderRadius: 999, background: '#FD8240', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={13} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif' }}>{lang === 'sw' ? 'Mpya' : 'New'}</span>
          </button>
          <button
            onClick={onOpenBudgetLimits}
            style={{ padding: 6, borderRadius: '50%', background: '#F6F6F4', border: 'none', cursor: 'pointer' }}
          >
            <Settings size={14} color="#4D4845" />
          </button>
        </div>
      </div>

      {/* Smart budget builder */}
      <SmartBudgetBuilder />

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
                <button
                  key={cat}
                  onClick={() => onCategorySelect(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                >
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
                  <ChevronRight size={14} color="#A6A4A0" style={{ flexShrink: 0 }} />
                </button>
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

      {/* Budget health bars per category */}
      <BudgetHealthBars />

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionHeader
              label={lang === 'sw' ? 'Miamala ya Hivi Karibuni' : 'Recent Transactions'}
              sub={`${transactions.length} ${lang === 'sw' ? 'jumla' : 'total'}`}
            />
            {transactions.length > 5 && (
              <button
                onClick={onHistory}
                style={{ fontSize: 12, color: '#928F8B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                {lang === 'sw' ? 'Zote' : 'See all'} <ChevronRight size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentExpenses.map(tx => (
              <button
                key={tx.id}
                onClick={() => onTxSelect(tx)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', textAlign: 'left', width: '100%' }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1px solid #F4F4F2', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(tx.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.notes || tx.category}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                    {tx.date.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: tx.type === 'expense' ? '#C9362B' : '#215B44', fontFamily: 'Geist, sans-serif' }}>
                    {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount)}
                  </p>
                  <ChevronRight size={12} color="#A6A4A0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Local benchmarks — how user compares to region peers */}
      <LocalBenchmarks />

      {/* Articles */}
      <MkCard>
        <div style={{ padding: 16 }}>
          <SectionHeader
            label={lang === 'sw' ? 'Makala' : 'Articles'}
            sub={lang === 'sw' ? 'Jifunze misingi ya bajeti' : 'Learn the fundamentals of budgeting'}
          />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
            {[
              { en: 'Overspending', sw: 'Kutumia Kupita Kiasi', subEn: 'Guide to avoiding the habit of overspending', subSw: 'Mwongozo wa kuzuia tabia ya kutumia kupita kiasi', lessonId: 'debt-awareness' },
              { en: 'Budgeting', sw: 'Bajeti', subEn: 'How to successfully manage your financial budget', subSw: 'Jinsi ya kusimamia bajeti yako ya kifedha', lessonId: 'rule-50-30-20' },
            ].map((a, i) => (
              <button
                key={i}
                onClick={() => onOpenLesson(a.lessonId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: i === 0 ? '1px solid #F4F4F2' : 'none', width: '100%', textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(78,136,111,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
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
              </button>
            ))}
          </div>
          <button
            onClick={() => onOpenLesson('rule-50-30-20')}
            style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 999,
              background: '#F6F6F4', color: '#4D4845', border: 'none',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Geist, sans-serif',
            }}
          >
            {lang === 'sw' ? 'Ona zaidi' : 'See more'}
          </button>
        </div>
      </MkCard>

      {/* Budget "New" type selection sheet */}
      <AnimatePresence>
        {showNewBudgetType && (
          <>
            <motion.div
              key="budget-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50 }}
              onClick={() => setShowNewBudgetType(false)}
            />
            <motion.div
              key="budget-sheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '24px 24px 0 0', zIndex: 51, padding: '20px 20px 48px' }}
            >
              {/* Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#F4F4F2', margin: '0 auto 20px' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Chagua Aina' : 'Select Type'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewBudgetType(false)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: '#F6F6F4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#4D4845' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#928F8B', marginBottom: 20, fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Chagua ni aina gani ya bajeti ungependa kuongeza' : 'Choose what type of budget item you want to add'}
              </p>

              {/* 3 type cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Budget */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewBudgetType(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16, background: '#1A3D2E', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                      <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="white" opacity="0.8"/>
                      <path d="M12 12 L22 12 A10 10 0 0 1 12 22 Z" fill="white" opacity="0.5"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif', marginBottom: 3 }}>
                      {lang === 'sw' ? 'Bajeti' : 'Budget'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Geist, sans-serif', lineHeight: 1.4 }}>
                      {lang === 'sw' ? 'Tenga sehemu ya fedha zako na ufuatilie matumizi' : 'Allocate a portion of your funds and track your expenses'}
                    </p>
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
                </motion.button>

                {/* Bills */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewBudgetType(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16, background: '#FFF3E8', border: '1.5px solid #FD824030', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FD8240', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', marginBottom: 3 }}>
                      {lang === 'sw' ? 'Bili' : 'Bills'}
                    </p>
                    <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif', lineHeight: 1.4 }}>
                      {lang === 'sw' ? 'Gharama zinazorudiwa kama kodi, umeme, n.k.' : 'Recurring expenses like rent, utility, etc.'}
                    </p>
                  </div>
                  <ChevronRight size={16} color="#A6A4A0" style={{ flexShrink: 0 }} />
                </motion.button>

                {/* Subscription */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewBudgetType(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16, background: '#FFF0ED', border: '1.5px solid #F55D3E30', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F55D3E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', marginBottom: 3 }}>
                      {lang === 'sw' ? 'Usajili' : 'Subscription'}
                    </p>
                    <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif', lineHeight: 1.4 }}>
                      {lang === 'sw' ? 'Gharama za mara kwa mara kama streaming, uanachama' : 'Recurring expenses like streaming, memberships, etc.'}
                    </p>
                  </div>
                  <ChevronRight size={16} color="#A6A4A0" style={{ flexShrink: 0 }} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── NEW GOAL BOTTOM SHEET ────────────────────────────────────────────────────
const GOAL_CATEGORIES = [
  { id: 'regular',    emoji: '💰', en: 'Regular Savings',  sw: 'Akiba ya Kawaida', fr: 'Épargne régulière',   ar: 'ادخار منتظم',   pt: 'Poupança regular',   color: '#4E886F', bg: '#4E886F1A' },
  { id: 'emergency',  emoji: '🛡️', en: 'Emergencies',       sw: 'Dharura',          fr: 'Urgences',           ar: 'طوارئ',          pt: 'Emergências',        color: '#FD8240', bg: '#FD82401A' },
  { id: 'life',       emoji: '🌟', en: 'Life Goals',        sw: 'Malengo ya Maisha', fr: 'Objectifs de vie',  ar: 'أهداف حياتية',  pt: 'Objetivos de vida',  color: '#215B44', bg: '#215B441A' },
  { id: 'holiday',    emoji: '✈️', en: 'Holidays',          sw: 'Likizo',           fr: 'Vacances',           ar: 'إجازات',          pt: 'Férias',             color: '#F55D3E', bg: '#F55D3E1A' },
];

type GoalCat = typeof GOAL_CATEGORIES[number];

const LIFE_GOALS = [
  { id: 'home',     en: 'Own a Home',       sw: 'Miliki Nyumba',      emoji: '🏠' },
  { id: 'family',   en: 'Start a Family',   sw: 'Anzisha Familia',    emoji: '👨‍👩‍👧' },
  { id: 'business', en: 'Start a Business', sw: 'Anzisha Biashara',   emoji: '💼' },
  { id: 'vacation', en: 'Go on a Vacation', sw: 'Tembelea Utalii',    emoji: '✈️' },
  { id: 'tuition',  en: 'Pay for Tuition',  sw: 'Lipia Masomo',       emoji: '🎓' },
  { id: 'retire',   en: 'Retirement',       sw: 'Kustaafu',           emoji: '🏖️' },
];

function NewGoalSheet({
  onClose,
  onConfirm,
  lang,
  region,
}: {
  onClose: () => void;
  onConfirm: (title: string, amount: number, emoji: string) => void;
  lang: import('@/app/App').Language;
  region: import('@/app/utils/currency').Region;
}) {
  const [phase, setPhase] = useState<'pick' | 'life-goals' | 'detail'>('pick');
  const [cat, setCat] = useState<GoalCat | null>(null);
  const [customName, setCustomName] = useState('');
  const [amount, setAmount] = useState('');
  const cfg = REGION_CONFIG[region];

  const catLabel = (c: GoalCat) =>
    lang === 'sw' ? c.sw : lang === 'fr' ? c.fr : lang === 'ar' ? c.ar : lang === 'pt' ? c.pt : c.en;

  const handlePick = (c: GoalCat) => {
    setCat(c);
    if (c.id === 'life') {
      setPhase('life-goals');
    } else {
      setPhase('detail');
    }
  };

  const handleLifeGoalPick = (g: typeof LIFE_GOALS[number]) => {
    setCustomName(lang === 'sw' ? g.sw : g.en);
    setPhase('detail');
  };

  const handleSave = () => {
    const num = parseInt(amount);
    if (!num || num < 1) return;
    const title = customName.trim() || catLabel(cat!);
    onConfirm(title, num, cat!.emoji);
  };

  const titleMap: Record<import('@/app/App').Language, string> = {
    en: 'New Goal', sw: 'Lengo Jipya', fr: 'Nouvel objectif', ar: 'هدف جديد', pt: 'Novo objetivo',
  };
  const chooseMap: Record<import('@/app/App').Language, string> = {
    en: 'Choose a category', sw: 'Chagua aina', fr: 'Choisissez une catégorie', ar: 'اختر فئة', pt: 'Escolha uma categoria',
  };
  const saveMap: Record<import('@/app/App').Language, string> = {
    en: 'Create Goal', sw: 'Unda Lengo', fr: 'Créer l\'objectif', ar: 'إنشاء الهدف', pt: 'Criar objetivo',
  };

  const goBack = () => {
    if (phase === 'detail' && cat?.id === 'life') setPhase('life-goals');
    else if (phase === 'detail' || phase === 'life-goals') setPhase('pick');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#F4F4F2', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          {phase !== 'pick' ? (
            <button type="button" onClick={goBack} style={{ padding: 8, background: '#F6F6F4', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} color="#4D4845" style={{ transform: 'rotate(180deg)' }} />
            </button>
          ) : <div style={{ width: 36 }} />}
          <p style={{ fontSize: 17, fontWeight: 600, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
            {phase === 'life-goals'
              ? (lang === 'sw' ? 'Malengo ya Maisha' : 'Life Goals')
              : titleMap[lang]}
          </p>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F6F6F4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#4D4845' }}>
            ✕
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'pick' && (
            <motion.div key="pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p style={{ fontSize: 14, color: '#928F8B', marginBottom: 16, fontFamily: 'Geist, sans-serif' }}>
                {chooseMap[lang]}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {GOAL_CATEGORIES.map(c => (
                  <motion.button
                    key={c.id}
                    type="button"
                    onClick={() => handlePick(c)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: c.bg, border: `1.5px solid ${c.color}30`,
                      borderRadius: 16, padding: '20px 16px', cursor: 'pointer',
                      textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{c.emoji}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', lineHeight: 1.3 }}>
                      {catLabel(c)}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'life-goals' && (
            <motion.div key="life-goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p style={{ fontSize: 14, color: '#928F8B', marginBottom: 16, fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Chagua lengo la maisha yako' : 'Select a life goal to save toward'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LIFE_GOALS.map(g => (
                  <motion.button
                    key={g.id}
                    type="button"
                    onClick={() => handleLifeGoalPick(g)}
                    whileTap={{ scale: 0.98 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F4F4F2' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1A3D2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {g.emoji}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', flex: 1 }}>
                      {lang === 'sw' ? g.sw : g.en}
                    </p>
                    <ChevronRight size={16} color="#A6A4A0" style={{ flexShrink: 0 }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'detail' && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Category pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: cat!.bg, borderRadius: 12 }}>
                <span style={{ fontSize: 22 }}>{cat!.emoji}</span>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{catLabel(cat!)}</p>
              </div>

              {/* Name */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Jina (hiari)' : lang === 'fr' ? 'Nom (optionnel)' : lang === 'ar' ? 'الاسم (اختياري)' : lang === 'pt' ? 'Nome (opcional)' : 'Name (optional)'}
                </p>
                <input
                  type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder={catLabel(cat!)}
                  style={{ width: '100%', background: '#F6F6F4', border: '1.5px solid #F4F4F2', color: '#4D4845', borderRadius: 12, padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'Geist, sans-serif', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = cat!.color)}
                  onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
                />
              </div>

              {/* Target amount */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Kiasi cha lengo' : lang === 'fr' ? 'Montant cible' : lang === 'ar' ? 'المبلغ المستهدف' : lang === 'pt' ? 'Valor alvo' : 'Target amount'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F6F4', border: '1.5px solid #F4F4F2', borderRadius: 12, padding: '12px 16px' }}>
                  <span style={{ color: '#928F8B', fontWeight: 600, fontFamily: 'Geist, sans-serif' }}>{cfg.symbol}</span>
                  <input
                    type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    style={{ flex: 1, background: 'transparent', color: '#4D4845', fontSize: 22, fontWeight: 600, outline: 'none', border: 'none', fontFamily: 'Geist, sans-serif' }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={!amount || parseInt(amount) < 1}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 999,
                  background: amount && parseInt(amount) >= 1 ? cat!.color : '#F4F4F2',
                  color: amount && parseInt(amount) >= 1 ? '#fff' : '#928F8B',
                  fontSize: 16, fontWeight: 600, border: 'none',
                  cursor: amount && parseInt(amount) >= 1 ? 'pointer' : 'not-allowed',
                  fontFamily: 'Geist, sans-serif', transition: 'all 0.2s',
                }}
              >
                {saveMap[lang]}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── SAVINGS TAB ──────────────────────────────────────────────────────────────
function SavingsTab({ onAddGoal, onGoalSelect, onAddIncome }: { onAddGoal: () => void; onGoalSelect: (goalId: string) => void; onAddIncome: () => void }) {
  const { state, updateGoal, deleteGoal, addGoal } = useApp();
  const { language: lang, goals, roundUpEnabled, roundUpSavings } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);
  const [showNewGoal, setShowNewGoal] = useState(false);

  const handleNewGoal = (title: string, amount: number, emoji: string) => {
    addGoal({ title, emoji, target: amount, current: 0 });
    setShowNewGoal(false);
  };

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
            <Pill label={lang === 'sw' ? 'Ongeza' : lang === 'fr' ? 'Ajouter' : lang === 'ar' ? 'إضافة' : lang === 'pt' ? 'Adicionar' : 'Add Goal'} onClick={() => setShowNewGoal(true)} />
            <Pill label={lang === 'sw' ? 'Toa' : 'Withdraw'} onClick={onAddIncome} />
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
                  onClick={() => setShowNewGoal(true)}
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
                    <button
                      type="button"
                      onClick={() => onGoalSelect(goal.id)}
                      style={{ display: 'block', width: '100%', padding: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
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
                        <ChevronRight size={16} color="#A6A4A0" style={{ flexShrink: 0, marginTop: 2 }} />
                      </div>
                      <p style={{ fontSize: 24, fontWeight: 400, color: '#4D4845', marginBottom: 12, fontFamily: 'Geist, sans-serif' }}>
                        {fmt(goal.target)}
                      </p>
                      <StripeProgressBar value={goal.current} max={goal.target} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                          {fmt(goal.current)} {lang === 'sw' ? 'imehifadhiwa' : 'saved'}
                        </p>
                        {goal.daysLeft != null && (
                          <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                            {goal.daysLeft} {lang === 'sw' ? 'siku zimebaki' : 'days left'}
                          </p>
                        )}
                      </div>
                    </button>
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
          label={lang === 'sw' ? 'Changamoto za Akiba' : lang === 'fr' ? 'Défis d\'épargne' : lang === 'ar' ? 'تحديات الادخار' : lang === 'pt' ? 'Desafios de poupança' : 'Savings Challenges'}
          sub={lang === 'sw' ? 'Ongeza akiba kwa changamoto za kila siku' : 'Boost savings with daily challenges'}
        />
        <div style={{ marginTop: 12 }}>
          <SavingsChallenge />
        </div>
      </div>

      {/* New Goal bottom sheet */}
      <AnimatePresence>
        {showNewGoal && (
          <NewGoalSheet
            lang={lang}
            region={state.region}
            onClose={() => setShowNewGoal(false)}
            onConfirm={handleNewGoal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── INVEST TAB ───────────────────────────────────────────────────────────────
type Timeframe = '1d' | '1m' | '3m' | '6m' | '1y' | 'All';

function generatePerformanceData(tf: Timeframe, base: number) {
  const points = tf === '1d' ? 24 : tf === '1m' ? 30 : tf === '3m' ? 90 : tf === '6m' ? 26 : tf === '1y' ? 52 : 60;
  const labels = tf === '1d'
    ? Array.from({ length: points }, (_, i) => `${i}h`)
    : tf === '1m' || tf === '3m'
    ? Array.from({ length: points }, (_, i) => `D${i + 1}`)
    : Array.from({ length: points }, (_, i) => `W${i + 1}`);
  let v = base;
  return labels.map(name => {
    v = Math.max(v * (0.97 + Math.random() * 0.06), base * 0.7);
    return { name, value: Math.round(v) };
  });
}

function InvestTab({ onPortfolioSelect, onStocksSelect, onNewPlan }: {
  onPortfolioSelect: (name: string) => void;
  onStocksSelect: () => void;
  onNewPlan: () => void;
}) {
  const { state } = useApp();
  const { language: lang } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);
  const [tf, setTf] = useState<Timeframe>('1m');
  const [showSetup, setShowSetup] = useState(false);

  const portfolioBase = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;
  const chartData = useMemo(() => generatePerformanceData(tf, portfolioBase || 100000), [tf, portfolioBase]);
  const chartStart = chartData[0]?.value ?? portfolioBase;
  const chartEnd = chartData[chartData.length - 1]?.value ?? portfolioBase;
  const gain = chartEnd - chartStart;
  const gainPct = chartStart > 0 ? ((gain / chartStart) * 100).toFixed(2) : '0.00';
  const positive = gain >= 0;

  const portfolios = [
    { id: 'easy_growth',  name: lang === 'sw' ? 'Akiba ya Hisa' : lang === 'fr' ? 'Actions Locales' : 'Local Equities', pct: '+12.4%', amount: portfolioBase * 0.45, color: '#4E886F' },
    { id: 'balanced',     name: lang === 'sw' ? 'Dhamana za Serikali' : lang === 'fr' ? 'Obligations d\'État' : 'Gov. Bonds', pct: '+5.1%', amount: portfolioBase * 0.3, color: '#215B44' },
    { id: 'growth_max',   name: lang === 'sw' ? 'Mali Isiyohamishika' : lang === 'fr' ? 'Immobilier' : 'Real Estate', pct: '+8.7%', amount: portfolioBase * 0.25, color: '#FD8240' },
  ];

  const assetClasses = [
    { label: lang === 'sw' ? 'Hisa' : lang === 'fr' ? 'Actions' : lang === 'ar' ? 'أسهم' : lang === 'pt' ? 'Ações' : 'Stocks',         emoji: '📈', sub: lang === 'sw' ? 'Hatari ya kati' : 'Medium risk' },
    { label: lang === 'sw' ? 'Mali Isiyohamishika' : lang === 'fr' ? 'Immobilier' : lang === 'ar' ? 'عقارات' : lang === 'pt' ? 'Imóveis' : 'Real Estate', emoji: '🏠', sub: lang === 'sw' ? 'Hatari ndogo' : 'Lower risk' },
    { label: lang === 'sw' ? 'Dhamana' : lang === 'fr' ? 'Obligations' : lang === 'ar' ? 'سندات' : lang === 'pt' ? 'Renda Fixa' : 'Fixed Income', emoji: '🏛️', sub: lang === 'sw' ? 'Hatari ndogo sana' : 'Lowest risk' },
  ];

  const L = (sw: string, en: string, fr?: string, ar?: string, pt?: string) =>
    lang === 'sw' ? sw : lang === 'fr' && fr ? fr : lang === 'ar' && ar ? ar : lang === 'pt' && pt ? pt : en;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>

      {/* Portfolio value card */}
      <MkCard>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
            {L('Thamani ya Mali', 'Portfolio Value', 'Valeur du portefeuille', 'قيمة المحفظة', 'Valor do portfólio')}
          </p>
          <p style={{ fontSize: 32, fontWeight: 400, color: '#4D4845', margin: '4px 0 2px', fontFamily: 'Geist, sans-serif' }}>
            {fmt(chartEnd)}
          </p>
          <p style={{ fontSize: 14, color: positive ? '#215B44' : '#C9362B', marginBottom: 16, fontFamily: 'Geist, sans-serif' }}>
            {positive ? '▲' : '▼'} {fmt(Math.abs(gain))} ({gainPct}%)
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill label={L('Wekeza', 'Invest', 'Investir', 'استثمر', 'Investir')} />
            <Pill label={L('Toa', 'Withdraw', 'Retirer', 'سحب', 'Sacar')} />
          </div>
        </div>
      </MkCard>

      {/* Performance chart */}
      <MkCard>
        <div style={{ padding: 16 }}>
          <SectionHeader
            label={L('Mwenendo wa Thamani', 'Performance Insight', 'Performance', 'الأداء', 'Desempenho')}
            sub={`${positive ? '+' : ''}${gainPct}% ${L('kipindi hiki', 'this period', 'cette période', 'هذه الفترة', 'neste período')}`}
          />
          {/* Timeframe pills */}
          <div style={{ display: 'flex', gap: 6, margin: '12px 0 8px', overflowX: 'auto' }}>
            {(['1d','1m','3m','6m','1y','All'] as Timeframe[]).map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                style={{
                  padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: tf === t ? '#4D4845' : '#F6F6F4',
                  color: tf === t ? '#fff' : '#928F8B',
                  fontSize: 12, fontWeight: 500, fontFamily: 'Geist, sans-serif', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F2" vertical={false} />
                <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), '']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F4F4F2' }}
                  labelStyle={{ display: 'none' }}
                />
                <Line
                  type="monotone" dataKey="value"
                  stroke={positive ? '#4E886F' : '#C9362B'}
                  strokeWidth={2} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </MkCard>

      {/* Portfolio breakdown */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionHeader label={L('Mikoba Yangu', 'My Portfolios', 'Mes portefeuilles', 'محافظي', 'Meus portfólios')} />
          <button
            type="button"
            onClick={onNewPlan}
            style={{ fontSize: 12, color: '#FD8240', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif', fontWeight: 500 }}
          >
            + {L('Ongeza', 'Add', 'Ajouter', 'أضف', 'Adicionar')}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {portfolios.map(p => (
            <MkCard key={p.name}>
              <button
                type="button"
                onClick={() => onPortfolioSelect(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${p.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={18} color={p.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif', marginTop: 2 }}>{fmt(p.amount)}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#215B44', fontFamily: 'Geist, sans-serif', flexShrink: 0 }}>{p.pct}</span>
                <ChevronRight size={14} color="#A6A4A0" style={{ flexShrink: 0 }} />
              </button>
            </MkCard>
          ))}
        </div>
      </div>

      {/* Set up new investment plan CTA */}
      <button
        onClick={onNewPlan}
        style={{
          width: '100%', padding: '18px 20px', borderRadius: 16,
          background: 'linear-gradient(135deg, #215B44, #4E886F)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif', marginBottom: 4 }}>
          🌱 {L('Unda Mpango wa Uwekezaji', 'Set Up New Investment Plan', 'Créer un plan d\'investissement', 'إنشاء خطة استثمار', 'Criar plano de investimento')}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Geist, sans-serif' }}>
          {L('Anza kuwekeza leo', 'Start investing with as little as 1,000', 'Commencez à investir dès aujourd\'hui', 'ابدأ الاستثمار اليوم', 'Comece a investir hoje')}
        </p>
      </button>

      {/* Asset classes */}
      <div>
        <SectionHeader
          label={L('Aina za Mali', 'Asset Classes', 'Classes d\'actifs', 'فئات الأصول', 'Classes de ativos')}
          sub={L('Gundua njia za kuwekeza', 'Explore ways to grow your money', 'Explorez les options', 'اكتشف خيارات الاستثمار', 'Explore opções')}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {assetClasses.map(a => (
            <MkCard key={a.label}>
              <button
                type="button"
                onClick={a.emoji === '📈' ? onStocksSelect : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: a.emoji === '📈' ? 'pointer' : 'default', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {a.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{a.label}</p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif', marginTop: 2 }}>{a.sub}</p>
                </div>
                <ChevronRight size={16} color="#A6A4A0" />
              </button>
            </MkCard>
          ))}
        </div>
      </div>

      {/* Risk appetite card */}
      <MkCard>
        <div style={{ padding: 16 }}>
          <SectionHeader
            label={L('Uvumilivu wa Hatari', 'Risk Appetite', 'Tolérance au risque', 'تحمل المخاطر', 'Apetite por risco')}
            sub={L('Jinsi unavyopenda hatari', 'How much risk you\'re comfortable with', 'Votre niveau de risque', 'مستوى المخاطرة المقبول لديك', 'Seu nível de risco')}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            {[
              { id: 'low',    label: L('Chini', 'Low', 'Faible', 'منخفض', 'Baixo'),    color: '#4E886F' },
              { id: 'medium', label: L('Kati',  'Medium', 'Moyen', 'متوسط', 'Médio'),  color: '#FD8240' },
              { id: 'high',   label: L('Juu',   'High', 'Élevé', 'مرتفع', 'Alto'),     color: '#C9362B' },
            ].map(r => (
              <button
                key={r.id}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  background: r.id === 'medium' ? `${r.color}1A` : '#F6F6F4',
                  border: r.id === 'medium' ? `1.5px solid ${r.color}` : '1.5px solid transparent',
                  color: r.id === 'medium' ? r.color : '#928F8B',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </MkCard>

      {/* Financial health + education */}
      <div>
        <SectionHeader label={L('Alama ya Afya ya Kifedha', 'Financial Health Score')} />
        <div style={{ marginTop: 12 }}><FinancialHealthScore /></div>
      </div>
      <div>
        <SectionHeader label={L('Elimu ya Kifedha', 'Financial Education', 'Éducation financière', 'التعليم المالي', 'Educação financeira')} />
        <div style={{ marginTop: 12 }}><FinancialEducation /></div>
      </div>

      {/* Setup modal placeholder */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#fff', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowSetup(false)} style={{ padding: 8, background: '#F6F6F4', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={18} color="#4D4845" style={{ transform: 'rotate(180deg)' }} />
              </button>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                {L('Mpango wa Uwekezaji', 'New Investment Plan', 'Nouveau plan d\'investissement', 'خطة استثمار جديدة', 'Novo plano de investimento')}
              </p>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 16 }}>
              <div style={{ fontSize: 64 }}>🌱</div>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#4D4845', textAlign: 'center', fontFamily: 'Geist, sans-serif' }}>
                {L('Karibu kwenye Uwekezaji', 'Welcome to Investing', 'Bienvenue dans l\'investissement', 'مرحباً بك في الاستثمار', 'Bem-vindo ao investimento')}
              </p>
              <p style={{ fontSize: 14, color: '#928F8B', textAlign: 'center', fontFamily: 'Geist, sans-serif', lineHeight: 1.6 }}>
                {L('Weka pesa yako ifanye kazi. Anza na kiasi kidogo na ukue polepole.', 'Put your money to work. Start small and grow steadily over time.', 'Faites travailler votre argent. Commencez petit et grandissez régulièrement.', 'اجعل أموالك تعمل. ابدأ صغيراً وانمُ باطراد.', 'Faça seu dinheiro trabalhar. Comece pequeno e cresça continuamente.')}
              </p>
              <button
                onClick={() => setShowSetup(false)}
                style={{ width: '100%', maxWidth: 340, background: '#4E886F', color: '#fff', borderRadius: 999, padding: '16px 0', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}
              >
                {L('Anza Sasa', 'Get Started', 'Commencer', 'ابدأ الآن', 'Começar')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SEND MONEY MODAL (dark green numpad) ────────────────────────────────────
function SendMoneyModal({ onClose, lang }: { onClose: () => void; lang: import('@/app/App').Language }) {
  const [amount, setAmount] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);

  const contacts = [
    { name: 'Alice',   initials: 'A', color: '#4E886F' },
    { name: 'Brian',   initials: 'B', color: '#FD8240' },
    { name: 'Cynthia', initials: 'C', color: '#215B44' },
    { name: 'David',   initials: 'D', color: '#F55D3E' },
  ];

  const pad = (v: string) => {
    if (v === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (v === '.' && amount.includes('.')) return;
    if (amount.length >= 12) return;
    setAmount(a => a === '0' ? v : a + v);
  };

  const sendLabel: Record<import('@/app/App').Language, string> = {
    en: 'Send', sw: 'Tuma', fr: 'Envoyer', ar: 'إرسال', pt: 'Enviar',
  };
  const toLabel: Record<import('@/app/App').Language, string> = {
    en: 'To', sw: 'Kwa', fr: 'À', ar: 'إلى', pt: 'Para',
  };

  if (sent) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#215B44', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          ✓
        </motion.div>
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 600, fontFamily: 'Geist, sans-serif' }}>
          {sendLabel[lang]}!
        </p>
        <motion.button onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'Geist, sans-serif', marginTop: 8 }}>
          Done
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#1A3D2E', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <p style={{ color: '#fff', fontSize: 16, fontWeight: 500, fontFamily: 'Geist, sans-serif' }}>{sendLabel[lang]} Money</p>
        <div style={{ width: 32 }} />
      </div>

      {/* Contact picker */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'Geist, sans-serif' }}>
          {toLabel[lang]}
        </p>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {contacts.map(c => (
            <button
              key={c.name}
              onClick={() => setContact(c.name)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: contact === c.name ? '#FD8240' : c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif',
                border: contact === c.name ? '2px solid #FD8240' : '2px solid transparent',
                boxShadow: contact === c.name ? '0 0 0 3px rgba(253,130,64,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                {c.initials}
              </div>
              <span style={{ color: contact === c.name ? '#FD8240' : 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Geist, sans-serif' }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount display */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Geist, sans-serif', marginBottom: 8 }}>
          {contact ? `${toLabel[lang]} ${contact}` : ''}
        </p>
        <p style={{ color: '#fff', fontSize: 52, fontWeight: 300, fontFamily: 'Geist, sans-serif', letterSpacing: '-0.02em', minHeight: 64 }}>
          {amount || '0'}
        </p>
      </div>

      {/* Numpad */}
      <div style={{ padding: '0 24px 16px' }}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['.',  '0','⌫']].map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {row.map(key => (
              <button
                key={key}
                onClick={() => pad(key)}
                style={{
                  height: 56, borderRadius: 16,
                  background: key === '⌫' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                  border: 'none', color: '#fff', fontSize: key === '⌫' ? 20 : 22, fontWeight: 400,
                  cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                  transition: 'background 0.1s',
                }}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        <button
          onClick={() => { if (amount && parseFloat(amount) > 0) setSent(true); }}
          style={{
            width: '100%', height: 56, borderRadius: 16,
            background: amount && parseFloat(amount) > 0 ? '#FD8240' : 'rgba(253,130,64,0.3)',
            border: 'none', color: '#fff', fontSize: 18, fontWeight: 600,
            cursor: amount && parseFloat(amount) > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'Geist, sans-serif', transition: 'background 0.2s',
          }}
        >
          {sendLabel[lang]}
        </button>
      </div>
    </motion.div>
  );
}

// ─── WALLET TAB ───────────────────────────────────────────────────────────────
// ─── LINKED CARD types ────────────────────────────────────────────────────────
interface LinkedCard {
  id: string;
  type: 'mastercard' | 'visa' | 'amex';
  last4: string;
  bank: string;
  holder: string;
  expiry: string;
  monthlySpend: number;
  gradient: [string, string];
}

interface SplitBill {
  id: string;
  description: string;
  total: number;
  participants: { name: string; initials: string; color: string; paid: boolean }[];
  createdAt: Date;
}

// Mastercard logo
function MastercardLogo({ size = 28 }: { size?: number }) {
  const r = size * 0.5;
  const overlap = size * 0.18;
  return (
    <svg width={size * 1.5} height={size} viewBox={`0 0 ${size * 1.5} ${size}`}>
      <circle cx={r} cy={r} r={r} fill="#EB001B" />
      <circle cx={r * 1.5 + overlap} cy={r} r={r} fill="#F79E1B" fillOpacity={0.9} />
      <circle cx={r * 1.5 + overlap} cy={r} r={r} fill="url(#mcoverlap)" />
      <defs>
        <clipPath id="mcclip"><circle cx={r} cy={r} r={r} /></clipPath>
        <circle id="mcoverlap" cx={r * 1.5 + overlap} cy={r} r={r} fill="#FF5F00" clipPath="url(#mcclip)" />
      </defs>
      {/* overlap blend */}
      <path d={`M ${r+overlap/2} ${r - r*0.85} A ${r} ${r} 0 0 1 ${r+overlap/2} ${r + r*0.85} A ${r} ${r} 0 0 1 ${r+overlap/2} ${r - r*0.85}`} fill="#FF5F00" opacity={0.6} />
    </svg>
  );
}

function VisaLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 60 20">
      <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="white" letterSpacing="-1">VISA</text>
    </svg>
  );
}

function CardVisual({ card }: { card: LinkedCard }) {
  const isVisa = card.type === 'visa';
  return (
    <div style={{
      width: 280, height: 165, borderRadius: 20, flexShrink: 0,
      background: `linear-gradient(135deg, ${card.gradient[0]}, ${card.gradient[1]})`,
      padding: '20px 22px', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', bottom: -50, right: 20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

      {/* Top row: bank + network */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'Geist, sans-serif' }}>{card.bank}</p>
        {isVisa ? <VisaLogo size={18} /> : <MastercardLogo size={22} />}
      </div>

      {/* Chip + number */}
      <div>
        {/* Chip */}
        <div style={{ width: 32, height: 24, borderRadius: 5, background: 'rgba(255,215,100,0.7)', marginBottom: 12, border: '1px solid rgba(255,215,100,0.4)' }} />
        <p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: '2px', fontFamily: 'Geist Mono, monospace' }}>
          •••• •••• •••• {card.last4}
        </p>
      </div>

      {/* Bottom: holder + expiry */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Geist, sans-serif' }}>Card Holder</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', fontFamily: 'Geist, sans-serif' }}>{card.holder}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Geist, sans-serif' }}>Expires</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', fontFamily: 'Geist, sans-serif' }}>{card.expiry}</p>
        </div>
      </div>
    </div>
  );
}

function LinkCardSheet({ onClose, onAdd, lang }: {
  onClose: () => void;
  onAdd: (card: Omit<LinkedCard, 'id' | 'monthlySpend'>) => void;
  lang: string;
}) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [cardType, setCardType] = useState<'mastercard' | 'visa' | 'amex'>('mastercard');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holder, setHolder] = useState('');
  const [bank, setBank] = useState('');

  const last4 = number.replace(/\s/g, '').slice(-4);

  const gradients: Record<string, [string, string]> = {
    mastercard: ['#1A3D2E', '#2D6A4F'],
    visa:       ['#1a1f36', '#2d3561'],
    amex:       ['#2C5F8A', '#1a3d5c'],
  };

  const handleAdd = () => {
    if (!holder || !expiry || number.replace(/\s/g, '').length < 12) return;
    onAdd({ type: cardType, last4: last4 || '0000', bank: bank || 'My Bank', holder, expiry, gradient: gradients[cardType] });
  };

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const networkTypes = [
    { id: 'mastercard', label: 'Mastercard' },
    { id: 'visa',       label: 'Visa' },
    { id: 'amex',       label: 'Amex' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 44px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#F4F4F2', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          {step === 'details' ? (
            <button type="button" onClick={() => setStep('type')} style={{ padding: 8, background: '#F6F6F4', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={18} color="#4D4845" style={{ transform: 'rotate(180deg)' }} />
            </button>
          ) : <div style={{ width: 36 }} />}
          <p style={{ fontSize: 17, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Unganisha Kadi' : 'Link a Card'}
          </p>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F6F6F4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#4D4845" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'type' ? (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p style={{ fontSize: 14, color: '#928F8B', marginBottom: 16, fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Chagua mtandao wa kadi yako' : 'Select your card network'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {networkTypes.map(n => (
                  <motion.button
                    key={n.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setCardType(n.id); setStep('details'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                      background: '#F6F6F4', border: '1.5px solid #F4F4F2', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: gradients[n.id][0], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {n.id === 'visa' ? <VisaLogo size={14} /> : n.id === 'mastercard' ? <MastercardLogo size={18} /> : <CreditCard size={20} color="#fff" />}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', flex: 1 }}>{n.label}</p>
                    <ChevronRight size={16} color="#A6A4A0" />
                  </motion.button>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '14px 16px', background: '#F6F6F4', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif', lineHeight: 1.5 }}>
                  {lang === 'sw'
                    ? 'Kadi yako inalindwa. Hatuhifadhi nambari kamili ya kadi.'
                    : 'Your card is protected with 256-bit encryption. We never store your full card number.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Live card preview */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <CardVisual card={{ id: 'preview', type: cardType, last4: last4 || '0000', bank: bank || 'My Bank', holder: holder || 'Card Holder', expiry: expiry || 'MM/YY', monthlySpend: 0, gradient: gradients[cardType] }} />
              </div>

              {[
                { label: lang === 'sw' ? 'Jina la Benki' : 'Bank Name', value: bank, setter: setBank, placeholder: 'e.g. Chase, Barclays', type: 'text' },
                { label: lang === 'sw' ? 'Jina la Mwenye Kadi' : 'Card Holder Name', value: holder, setter: setHolder, placeholder: 'Full name on card', type: 'text' },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>{f.label}</p>
                  <input
                    type={f.type} value={f.value} placeholder={f.placeholder}
                    onChange={e => f.setter(e.target.value)}
                    style={{ width: '100%', background: '#F6F6F4', border: '1.5px solid #F4F4F2', color: '#1A3D2E', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'Geist, sans-serif', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#4E886F')}
                    onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
                  />
                </div>
              ))}

              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>Card Number</p>
                <input
                  type="tel" inputMode="numeric" value={number} placeholder="0000 0000 0000 0000"
                  onChange={e => setNumber(formatCardNumber(e.target.value))}
                  style={{ width: '100%', background: '#F6F6F4', border: '1.5px solid #F4F4F2', color: '#1A3D2E', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'Geist Mono, monospace', letterSpacing: '2px', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#4E886F')}
                  onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>Expiry</p>
                  <input
                    type="tel" inputMode="numeric" value={expiry} placeholder="MM/YY"
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    style={{ width: '100%', background: '#F6F6F4', border: '1.5px solid #F4F4F2', color: '#1A3D2E', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'Geist Mono, monospace', letterSpacing: '2px', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#4E886F')}
                    onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
                  />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>CVV</p>
                  <input
                    type="password" inputMode="numeric" maxLength={4} value={cvv} placeholder="•••"
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ width: '100%', background: '#F6F6F4', border: '1.5px solid #F4F4F2', color: '#1A3D2E', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'Geist, sans-serif', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#4E886F')}
                    onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
                  />
                </div>
              </div>

              <button
                type="button" onClick={handleAdd}
                disabled={!holder || !expiry || number.replace(/\s/g, '').length < 12}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 999, border: 'none',
                  background: holder && expiry && number.replace(/\s/g, '').length >= 12 ? '#4E886F' : '#F4F4F2',
                  color: holder && expiry && number.replace(/\s/g, '').length >= 12 ? '#fff' : '#928F8B',
                  fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif', transition: 'all 0.2s',
                }}
              >
                {lang === 'sw' ? 'Unganisha Kadi' : 'Link Card'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

const SPLIT_CONTACTS = [
  { name: 'Alice',   initials: 'A', color: '#4E886F' },
  { name: 'Brian',   initials: 'B', color: '#FD8240' },
  { name: 'Cynthia', initials: 'C', color: '#215B44' },
  { name: 'David',   initials: 'D', color: '#F55D3E' },
  { name: 'Eva',     initials: 'E', color: '#4D4845' },
  { name: 'Felix',   initials: 'F', color: '#9B59B6' },
];

function SplitBillSheet({ onClose, onAdd, lang, region }: {
  onClose: () => void;
  onAdd: (split: Omit<SplitBill, 'id' | 'createdAt'>) => void;
  lang: string;
  region: import('@/app/utils/currency').Region;
}) {
  const cfg = REGION_CONFIG[region];
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const perPerson = selected.length > 0 && parseFloat(amount) > 0
    ? parseFloat(amount) / (selected.length + 1)
    : 0;

  const toggle = (name: string) =>
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleCreate = () => {
    if (!description || !amount || selected.length === 0) return;
    const participants = [
      { name: 'You', initials: 'Y', color: '#1A3D2E', paid: true },
      ...selected.map(n => {
        const c = SPLIT_CONTACTS.find(c => c.name === n)!;
        return { name: c.name, initials: c.initials, color: c.color, paid: false };
      }),
    ];
    onAdd({ description, total: parseFloat(amount), participants });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 44px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#F4F4F2', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ width: 36 }} />
          <p style={{ fontSize: 17, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Gawanya Bili' : 'Split a Bill'}
          </p>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F6F6F4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#4D4845" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Maelezo' : 'Description'}
            </p>
            <input
              type="text" value={description} placeholder={lang === 'sw' ? 'mf. Chakula cha jioni' : 'e.g. Dinner, Rent, Trip'}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', background: '#F6F6F4', border: '1.5px solid #F4F4F2', color: '#1A3D2E', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'Geist, sans-serif', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#4E886F')}
              onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
            />
          </div>

          {/* Amount */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Jumla ya Bili' : 'Total Amount'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F6F4', border: '1.5px solid #F4F4F2', borderRadius: 12, padding: '13px 16px' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{cfg.symbol}</span>
              <input
                type="number" inputMode="decimal" value={amount} placeholder="0.00"
                onChange={e => setAmount(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 22, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}
              />
            </div>
          </div>

          {/* Contacts */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Chagua washiriki' : 'Split with'}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {SPLIT_CONTACTS.map(c => {
                const isSelected = selected.includes(c.name);
                return (
                  <button
                    key={c.name} type="button"
                    onClick={() => toggle(c.name)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%', background: isSelected ? c.color : '#F6F6F4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: isSelected ? `2.5px solid ${c.color}` : '2px solid #F4F4F2',
                      position: 'relative', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 17, fontWeight: 600, color: isSelected ? '#fff' : '#928F8B', fontFamily: 'Geist, sans-serif' }}>{c.initials}</span>
                      {isSelected && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#4E886F', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: isSelected ? '#1A3D2E' : '#928F8B', fontFamily: 'Geist, sans-serif', fontWeight: isSelected ? 500 : 400 }}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-person preview */}
          {perPerson > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#F0F7F4', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <p style={{ fontSize: 12, color: '#4E886F', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Kila mtu analipa' : 'Each person pays'}
                </p>
                <p style={{ fontSize: 22, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}>
                  {cfg.symbol}{perPerson.toFixed(2)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={14} color="#4E886F" />
                <span style={{ fontSize: 13, color: '#4E886F', fontFamily: 'Geist, sans-serif' }}>{selected.length + 1} {lang === 'sw' ? 'watu' : 'people'}</span>
              </div>
            </motion.div>
          )}

          <button
            type="button" onClick={handleCreate}
            disabled={!description || !amount || selected.length === 0}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 999, border: 'none',
              background: description && amount && selected.length > 0 ? '#1A3D2E' : '#F4F4F2',
              color: description && amount && selected.length > 0 ? '#fff' : '#928F8B',
              fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif', transition: 'all 0.2s',
            }}
          >
            {lang === 'sw' ? 'Unda Mgawanyo' : 'Create Split'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function WalletTab({
  onAddIncome,
  onAddExpense,
  onSettings,
  onHistory,
  onTxSelect,
}: {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onTxSelect: (tx: Transaction) => void;
}) {
  const { state } = useApp();
  const { language: lang } = state;
  const fmt = (n: number) => formatCurrency(n, state.region);
  const [showSend, setShowSend] = useState(false);
  const [showLinkCard, setShowLinkCard] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [linkedCards, setLinkedCards] = useState<LinkedCard[]>([
    { id: '1', type: 'mastercard', last4: '5642', bank: 'Chase Bank', holder: 'J. Mafie', expiry: '09/27', monthlySpend: 312.45, gradient: ['#1A3D2E', '#2D6A4F'] },
  ]);
  const [splits, setSplits] = useState<SplitBill[]>([
    {
      id: '1',
      description: 'Dinner at Nusr-Et',
      total: 180,
      participants: [
        { name: 'You',    initials: 'Y', color: '#1A3D2E', paid: true },
        { name: 'Alice',  initials: 'A', color: '#4E886F', paid: true },
        { name: 'Brian',  initials: 'B', color: '#FD8240', paid: false },
      ],
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ]);

  const walletTotal = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;

  const quickSend = [
    { name: 'Alice',   initials: 'A', color: '#4E886F' },
    { name: 'Brian',   initials: 'B', color: '#FD8240' },
    { name: 'Cynthia', initials: 'C', color: '#215B44' },
    { name: 'David',   initials: 'D', color: '#F55D3E' },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 20px 100px' }}>

        {/* Wallet balance */}
        <MkCard>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Salio la Mkoba' : 'Wallet Balance'}
            </p>
            <p style={{ fontSize: 32, fontWeight: 400, color: '#1A3D2E', margin: '4px 0 16px', fontFamily: 'Geist, sans-serif' }}>
              {fmt(walletTotal)}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Pill label={lang === 'sw' ? 'Ingiza' : 'Fund'} onClick={onAddIncome} />
              <Pill label={lang === 'sw' ? 'Tuma' : 'Send'} onClick={() => setShowSend(true)} />
              <Pill label={lang === 'sw' ? 'Pokea' : 'Receive'} onClick={onAddIncome} />
            </div>
          </div>
        </MkCard>

        {/* ── Linked Cards ─────────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionHeader
              label={lang === 'sw' ? 'Kadi Zilizounganishwa' : 'Linked Cards'}
              sub={lang === 'sw' ? 'Fuatilia matumizi ya kadi yako' : 'Monitor your card spending'}
            />
            <button
              type="button"
              onClick={() => setShowLinkCard(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, background: '#1A3D2E', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={12} color="#fff" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Ongeza' : 'Add'}
              </span>
            </button>
          </div>

          {linkedCards.length === 0 ? (
            <motion.button
              type="button" whileTap={{ scale: 0.98 }}
              onClick={() => setShowLinkCard(true)}
              style={{
                width: '100%', padding: '28px 20px', borderRadius: 20,
                background: '#F6F6F4', border: '1.5px dashed #D0CEC9',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1A3D2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={22} color="#fff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', marginBottom: 4 }}>
                  {lang === 'sw' ? 'Unganisha Kadi Yako' : 'Link Your Card'}
                </p>
                <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Fuatilia matumizi yote mahali pamoja' : 'Track all spending in one place'}
                </p>
              </div>
            </motion.button>
          ) : (
            <div>
              {/* Horizontal card scroller */}
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                {linkedCards.map(card => (
                  <div key={card.id}>
                    <CardVisual card={card} />
                    {/* Spend summary below card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '0 4px' }}>
                      <div>
                        <p style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                          {lang === 'sw' ? 'Matumizi ya Mwezi' : 'Monthly Spend'}
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}>
                          {fmt(card.monthlySpend)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: '#F0F7F4' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4E886F' }} />
                        <span style={{ fontSize: 11, color: '#4E886F', fontFamily: 'Geist, sans-serif', fontWeight: 500 }}>
                          {lang === 'sw' ? 'Imeunganishwa' : 'Connected'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add another card */}
                <motion.button
                  type="button" whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLinkCard(true)}
                  style={{
                    width: 280, height: 165, borderRadius: 20, flexShrink: 0,
                    background: '#F6F6F4', border: '1.5px dashed #D0CEC9',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A3D2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={18} color="#fff" />
                  </div>
                  <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? 'Ongeza Kadi' : 'Add Another Card'}
                  </p>
                </motion.button>
              </div>

              {/* Recent card transactions from linked cards */}
              {state.transactions.filter(t => t.type === 'expense').length > 0 && (
                <MkCard style={{ marginTop: 16 }}>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A3D2E', marginBottom: 12, fontFamily: 'Geist, sans-serif' }}>
                      {lang === 'sw' ? 'Miamala ya Hivi Karibuni' : 'Recent Card Activity'}
                    </p>
                    {state.transactions.filter(t => t.type === 'expense').slice(0, 3).map((tx, i, arr) => (
                      <button
                        key={tx.id} type="button" onClick={() => onTxSelect(tx)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #F4F4F2' : 'none', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                          {getCategoryIcon(tx.category)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes || tx.category}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <MastercardLogo size={12} />
                            <span style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>•••• {linkedCards[0]?.last4 ?? '0000'}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#C9362B', flexShrink: 0, fontFamily: 'Geist, sans-serif' }}>
                          -{fmt(tx.amount)}
                        </p>
                      </button>
                    ))}
                  </div>
                </MkCard>
              )}
            </div>
          )}
        </div>

        {/* ── Split Bills ──────────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionHeader
              label={lang === 'sw' ? 'Gawanya Bili' : 'Split Bills'}
              sub={lang === 'sw' ? 'Gawanya gharama na marafiki' : 'Share expenses with friends'}
            />
            <button
              type="button"
              onClick={() => setShowSplitBill(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, background: '#FD8240', border: 'none', cursor: 'pointer' }}
            >
              <Split size={12} color="#fff" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Gawanya' : 'New Split'}
              </span>
            </button>
          </div>

          {splits.length === 0 ? (
            <motion.button
              type="button" whileTap={{ scale: 0.98 }}
              onClick={() => setShowSplitBill(true)}
              style={{ width: '100%', padding: '28px 20px', borderRadius: 20, background: '#FFF3E8', border: '1.5px dashed #FD824050', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FD8240', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="#fff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', marginBottom: 4 }}>
                  {lang === 'sw' ? 'Gawanya Bili Yako' : 'Split Your First Bill'}
                </p>
                <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Gawanya gharama kwa urahisi' : 'Easily split costs with friends'}
                </p>
              </div>
            </motion.button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {splits.map(split => {
                const totalParticipants = split.participants.length;
                const paidCount = split.participants.filter(p => p.paid).length;
                const perPerson = split.total / totalParticipants;
                const settled = paidCount === totalParticipants;
                return (
                  <MkCard key={split.id}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', marginBottom: 2 }}>{split.description}</p>
                          <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                            {split.createdAt.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <p style={{ fontSize: 16, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif' }}>{fmt(split.total)}</p>
                          <p style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{fmt(perPerson)}/{lang === 'sw' ? 'kila mtu' : 'person'}</p>
                        </div>
                      </div>

                      {/* Participants row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 0 }}>
                          {split.participants.map((p, i) => (
                            <div key={p.name} style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: p.color, border: '2px solid #fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginLeft: i === 0 ? 0 : -8,
                              position: 'relative', zIndex: split.participants.length - i,
                            }}>
                              {p.paid
                                ? <Check size={12} color="#fff" strokeWidth={3} />
                                : <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif' }}>{p.initials}</span>}
                            </div>
                          ))}
                        </div>
                        <div style={{
                          padding: '4px 10px', borderRadius: 999,
                          background: settled ? '#F0F7F4' : '#FFF3E8',
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: settled ? '#4E886F' : '#FD8240', fontFamily: 'Geist, sans-serif' }}>
                            {settled
                              ? (lang === 'sw' ? 'Imelipwa' : 'Settled')
                              : `${paidCount}/${totalParticipants} ${lang === 'sw' ? 'wamelipa' : 'paid'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </MkCard>
                );
              })}

              <button
                type="button" onClick={() => setShowSplitBill(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 16, background: '#FFF3E8', border: '1.5px dashed #FD824040', cursor: 'pointer' }}
              >
                <Plus size={16} color="#FD8240" />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#FD8240', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Mgawanyo Mpya' : 'New Split'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ── Quick Send ───────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader label={lang === 'sw' ? 'Tuma Haraka' : 'Quick Send'} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {quickSend.map(c => (
              <button
                key={c.name} type="button"
                onClick={() => setShowSend(true)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#fff', fontFamily: 'Geist, sans-serif' }}>
                  {c.initials}
                </div>
                <span style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{c.name}</span>
              </button>
            ))}
            <button
              type="button" onClick={() => setShowSplitBill(true)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F6F6F4', border: '1.5px dashed #D0CEC9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} color="#928F8B" />
              </div>
              <span style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? 'Zaidi' : 'More'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Transaction History ───────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionHeader
              label={lang === 'sw' ? 'Historia ya Miamala' : 'Transaction History'}
              sub={`${state.transactions.length} ${lang === 'sw' ? 'jumla' : 'total'}`}
            />
            <button type="button" onClick={onHistory} style={{ fontSize: 12, color: '#928F8B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
              {lang === 'sw' ? 'Angalia zote' : 'See all'} <ChevronRight size={12} />
            </button>
          </div>
          {state.transactions.length === 0 ? (
            <MkCard>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Hakuna miamala bado' : 'No transactions yet'}
                </p>
              </div>
            </MkCard>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', overflow: 'hidden' }}>
              {state.transactions.slice(0, 6).map((tx, i, arr) => (
                <button
                  key={tx.id} type="button" onClick={() => onTxSelect(tx)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F4F4F2' : 'none', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {getCategoryIcon(tx.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes || tx.category}</p>
                    <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                      {tx.source} · {tx.date.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: tx.type === 'income' ? '#215B44' : '#C9362B', flexShrink: 0, fontFamily: 'Geist, sans-serif' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSend && <SendMoneyModal lang={lang} onClose={() => setShowSend(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showLinkCard && (
          <LinkCardSheet
            lang={lang}
            onClose={() => setShowLinkCard(false)}
            onAdd={card => {
              setLinkedCards(prev => [...prev, { ...card, id: Date.now().toString(), monthlySpend: 0 }]);
              setShowLinkCard(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSplitBill && (
          <SplitBillSheet
            lang={lang}
            region={state.region}
            onClose={() => setShowSplitBill(false)}
            onAdd={split => {
              setSplits(prev => [{ ...split, id: Date.now().toString(), createdAt: new Date() }, ...prev]);
              setShowSplitBill(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── TRANSACTION DETAIL SHEET ─────────────────────────────────────────────────
function TransactionDetailSheet({
  tx,
  onClose,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const { state } = useApp();
  const lang = state.language;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const sourceLabel: Record<string, string> = {
    cash: lang === 'sw' ? 'Pesa Taslimu' : 'Cash',
    mpesa: 'M-Pesa',
    airtel: 'Airtel Money',
    tigo: 'Tigo Pesa',
    bank: lang === 'sw' ? 'Benki' : 'Bank',
    loan: lang === 'sw' ? 'Mkopo' : 'Loan',
  };
  const sourceIcon: Record<string, string> = {
    cash: '💵', mpesa: '📱', airtel: '📱', tigo: '📱', bank: '🏦', loan: '💳',
  };
  const isExpense = tx.type === 'expense';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E5E3E0' }} />
        </div>

        {/* Category icon + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: isExpense ? 'rgba(201,54,43,0.08)' : 'rgba(78,136,111,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, marginBottom: 12,
          }}>
            {getCategoryIcon(tx.category)}
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', textAlign: 'center' }}>
            {tx.notes || tx.category}
          </p>
          <p style={{ fontSize: 36, fontWeight: 300, color: isExpense ? '#C9362B' : '#215B44', fontFamily: 'Geist, sans-serif', margin: '8px 0' }}>
            {isExpense ? '-' : '+'}{fmt(tx.amount)}
          </p>
        </div>

        {/* Detail rows */}
        <div style={{ margin: '16px 20px 0', borderRadius: 16, border: '1px solid #F4F4F2', overflow: 'hidden' }}>
          {[
            {
              label: lang === 'sw' ? 'Tarehe' : 'Date',
              value: tx.date.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { day: 'numeric', month: 'long', year: 'numeric' }) +
                ' · ' + tx.date.toLocaleTimeString(lang === 'sw' ? 'sw' : 'en', { hour: '2-digit', minute: '2-digit' }),
            },
            { label: lang === 'sw' ? 'Chanzo' : 'Payment Source', value: `${sourceIcon[tx.source] || '💳'} ${sourceLabel[tx.source] || tx.source}` },
            { label: lang === 'sw' ? 'Kundi' : 'Category', value: `${getCategoryIcon(tx.category)} ${tx.category}` },
            { label: lang === 'sw' ? 'Aina' : 'Type', value: isExpense ? (lang === 'sw' ? 'Matumizi' : 'Expense') : (lang === 'sw' ? 'Mapato' : 'Income') },
            ...(tx.notes ? [{ label: lang === 'sw' ? 'Maelezo' : 'Notes', value: tx.notes }] : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #F4F4F2' : 'none',
              }}
            >
              <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif', maxWidth: '60%', textAlign: 'right' }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px 32px' }}>
          <button
            onClick={() => { onEdit(tx); onClose(); }}
            style={{
              flex: 1, padding: '14px', borderRadius: 16, border: '1.5px solid #4E886F',
              background: 'transparent', color: '#4E886F', fontSize: 14, fontWeight: 600,
              fontFamily: 'Geist, sans-serif', cursor: 'pointer',
            }}
          >
            {lang === 'sw' ? 'Hariri' : 'Edit'}
          </button>
          <button
            onClick={() => { onDelete(tx.id); onClose(); }}
            style={{
              flex: 1, padding: '14px', borderRadius: 16, border: 'none',
              background: 'rgba(201,54,43,0.08)', color: '#C9362B', fontSize: 14, fontWeight: 600,
              fontFamily: 'Geist, sans-serif', cursor: 'pointer',
            }}
          >
            {lang === 'sw' ? 'Futa' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export function Dashboard() {
  const { state, shouldShowDailySummary, markDailySummaryShown, toggleEmergencyMode, deleteTransaction } = useApp();
  const lang = state.language;

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const tabDirectionRef = useRef<1 | -1>(1);
  const [showNewTypeSheet, setShowNewTypeSheet] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [prefilledCategory, setPrefilledCategory] = useState<string | undefined>();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGoalsView, setShowGoalsView] = useState(false);
  const [showBudgetLimits, setShowBudgetLimits] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [investView, setInvestView] = useState<{ view: 'purpose' | 'portfolioDetail' | 'stocksList'; name?: string } | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

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
        switchTab(TAB_ORDER[idx + 1]);
        if (navigator.vibrate) navigator.vibrate(8);
      } else if (dx > 0 && idx > 0) {
        switchTab(TAB_ORDER[idx - 1]);
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

  const tabTitles: Record<ActiveTab, Record<import('@/app/App').Language, string>> = {
    home:    { en: 'Home',         sw: 'Nyumbani',  fr: 'Accueil',       ar: 'الرئيسية',  pt: 'Início'      },
    budget:  { en: 'Budget',       sw: 'Bajeti',    fr: 'Budget',        ar: 'الميزانية', pt: 'Orçamento'   },
    savings: { en: 'Savings',      sw: 'Akiba',     fr: 'Épargne',       ar: 'المدخرات',  pt: 'Poupança'    },
    invest:  { en: 'Invest',       sw: 'Wekeza',    fr: 'Investir',      ar: 'استثمار',   pt: 'Investir'    },
    wallet:  { en: 'Wallet',       sw: 'Mkoba',     fr: 'Portefeuille',  ar: 'محفظة',     pt: 'Carteira'    },
  };

  function switchTab(next: ActiveTab) {
    const cur = TAB_ORDER.indexOf(activeTab);
    const nxt = TAB_ORDER.indexOf(next);
    tabDirectionRef.current = nxt >= cur ? 1 : -1;
    setActiveTab(next);
  }

  function openAddExpense(category?: string) { setTxType('expense'); setPrefilledCategory(category); setShowAddTx(true); }
  function openAddIncome()  { setTxType('income'); setPrefilledCategory(undefined); setShowAddTx(true); }
  function openFAB() { setShowNewTypeSheet(true); }

  // Bell dot: true when there are non-dismissed budget/streak/goal alerts
  const hasBudgetAlert = Object.entries(state.categoryBudgets).some(([cat, limit]) => {
    const spent = state.transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
    return spent > limit * 0.85;
  });
  const hasStreakAlert = state.streak > 0 && !state.transactions.some(t => t.date.toDateString() === new Date().toDateString());
  const bellDot = (hasBudgetAlert || hasStreakAlert) && !state.dismissedNotifications.includes('streak-reminder');

  // Full-screen overlays — slide in from right (iOS push navigation feel)
  const slideOverlay = (bg: string, children: React.ReactNode) => (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      style={{ width: '100%', maxWidth: 448, height: '100%', overflowY: 'auto', background: bg, position: 'absolute', top: 0, left: 0, zIndex: 40 }}
    >
      {children}
    </motion.div>
  );

  if (showSettings)    return slideOverlay('#fff', <SettingsView onBack={() => setShowSettings(false)} />);
  if (showInsights)    return slideOverlay('#fff', <InsightsView onBack={() => setShowInsights(false)} />);
  if (showHistory)     return slideOverlay('#fff', <HistoryView onBack={() => setShowHistory(false)} />);
  if (showGoalsView)   return slideOverlay('#fff', <GoalsView onBack={() => setShowGoalsView(false)} />);
  if (selectedCategory) return slideOverlay('#F6F6F4', <BudgetCategoryView category={selectedCategory} onBack={() => setSelectedCategory(null)} />);
  if (selectedGoalId) {
    const goal = state.goals.find(g => g.id === selectedGoalId);
    if (goal) return slideOverlay('#F6F6F4', <GoalDetailView goal={goal} onBack={() => setSelectedGoalId(null)} />);
  }
  if (investView) return slideOverlay('#F6F6F4', <InvestDetailView initialView={investView.view} portfolioName={investView.name} onBack={() => setInvestView(null)} />);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 448,
        height: '100%',
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
      <ExitExperience />

      {/* Top Nav */}
      <TopNav
        title={tabTitles[activeTab][lang] ?? tabTitles[activeTab].en}
        onBell={() => window.dispatchEvent(new Event('maokoto:open-notifications'))}
        onAvatar={() => setShowSettings(true)}
        bellDot={bellDot}
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
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <AnimatePresence mode="wait" custom={tabDirectionRef.current}>
          <motion.div
            key={activeTab}
            custom={tabDirectionRef.current}
            initial={(dir: number) => ({ opacity: 0, x: dir * 28 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(dir: number) => ({ opacity: 0, x: -dir * 28 })}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'home' && (
              <HomeTab
                onAddIncome={openAddIncome}
                onAddExpense={openAddExpense}
                onSettings={() => setShowSettings(true)}
                onInsights={() => setShowInsights(true)}
                onHistory={() => setShowHistory(true)}
                onTxSelect={tx => setSelectedTxDetail(tx)}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetTab
                onOpenBudgetLimits={() => setShowBudgetLimits(true)}
                onCategorySelect={cat => setSelectedCategory(cat)}
                onTxSelect={tx => setSelectedTxDetail(tx)}
                onHistory={() => setShowHistory(true)}
                onOpenLesson={id => window.dispatchEvent(new CustomEvent('maokoto:open-lesson', { detail: id }))}
              />
            )}
            {activeTab === 'savings' && (
              <SavingsTab
                onAddGoal={() => setShowGoalsView(true)}
                onGoalSelect={id => setSelectedGoalId(id)}
                onAddIncome={openAddIncome}
              />
            )}
            {activeTab === 'invest' && (
              <InvestTab
                onPortfolioSelect={name => setInvestView({ view: 'portfolioDetail', name })}
                onStocksSelect={() => setInvestView({ view: 'stocksList' })}
                onNewPlan={() => setInvestView({ view: 'purpose' })}
              />
            )}
            {activeTab === 'wallet' && (
              <WalletTab
                onAddIncome={openAddIncome}
                onAddExpense={openAddExpense}
                onSettings={() => setShowSettings(true)}
                onHistory={() => setShowHistory(true)}
                onTxSelect={tx => setSelectedTxDetail(tx)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        onClick={openFAB}
        whileTap={{ scale: 0.88 }}
        animate={{
          rotate: showNewTypeSheet ? 45 : 0,
          background: showNewTypeSheet ? '#F55D3E' : '#4E886F',
          boxShadow: showNewTypeSheet
            ? '0 4px 20px rgba(245,93,62,0.45)'
            : '0 4px 16px rgba(78,136,111,0.4)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
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
      </motion.button>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onChange={switchTab} lang={lang} />

      {/* Create New type pre-selector */}
      <AnimatePresence>
        {showNewTypeSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowNewTypeSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E5E3E0' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? 'Ongeza' : 'New'}
                </p>
                <button onClick={() => setShowNewTypeSheet(false)} style={{ background: '#F6F6F4', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={14} color="#4D4845" style={{ transform: 'rotate(45deg)' }} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
                {/* Income entry */}
                <button
                  onClick={() => { setShowNewTypeSheet(false); openAddIncome(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(33,91,68,0.08)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 24 }}>💵</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#215B44', fontFamily: 'Geist, sans-serif', marginBottom: 2 }}>{lang === 'sw' ? 'Mapato' : 'Income'}</p>
                    <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{lang === 'sw' ? 'Ingiza mshahara, biashara au mapato yoyote' : 'Log salary, business earnings or any income'}</p>
                  </div>
                  <ChevronRight size={16} color="#215B44" />
                </button>
                {/* Expense entries */}
                {[
                  { icon: '💰', label: lang === 'sw' ? 'Matumizi' : 'Expense', sub: lang === 'sw' ? 'Gawanya fedha na fuatilia matumizi' : 'Allocate funds and track your expenses', color: '#1A3D2E', bg: 'rgba(26,61,46,0.08)', category: undefined as string | undefined },
                  { icon: '🧾', label: lang === 'sw' ? 'Bili' : 'Bills', sub: lang === 'sw' ? 'Matumizi ya mara kwa mara kama kodi, stima' : 'Recurring expenses like rent, utility, etc.', color: '#FD8240', bg: 'rgba(253,130,64,0.08)', category: lang === 'sw' ? 'Malipo' : 'Bills' },
                  { icon: '📱', label: lang === 'sw' ? 'Usajili' : 'Subscription', sub: lang === 'sw' ? 'Matumizi ya kila mwezi kama Netflix, Spotify' : 'Recurring expenses like streaming, memberships', color: '#E05C7A', bg: 'rgba(224,92,122,0.08)', category: lang === 'sw' ? 'Burudani' : 'Entertainment' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { setShowNewTypeSheet(false); openAddExpense(opt.category); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 16,
                      background: opt.bg, border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: opt.color, fontFamily: 'Geist, sans-serif', marginBottom: 2 }}>{opt.label}</p>
                      <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{opt.sub}</p>
                    </div>
                    <ChevronRight size={16} color={opt.color} />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      {showAddTx && (
        <AddTransactionDialog
          type={txType}
          prefilledCategory={prefilledCategory}
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
      <AIAssistant />
      <NotificationCenter />

      {/* Transaction detail sheet */}
      <AnimatePresence>
        {selectedTxDetail && (
          <TransactionDetailSheet
            tx={selectedTxDetail}
            onClose={() => setSelectedTxDetail(null)}
            onEdit={tx => setEditingTx(tx)}
            onDelete={id => { deleteTransaction(id); setSelectedTxDetail(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
