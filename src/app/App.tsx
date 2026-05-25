import { useState, ReactNode, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AppContext, useApp } from './AppContext';
export { useApp };

// ── Bootstrap i18next (side-effect import — must be first) ────────────────────
import '@/i18n';
import { syncI18nLanguage } from '@/i18n';
import { Analytics } from '@/app/utils/analytics';
import type { Region } from '@/app/utils/currency';
import { schedulePush, pullIfNewer, deleteCloudData } from '@/lib/cloudSync';
export type { Region };

// Types
export type Language = 'en' | 'sw' | 'fr' | 'ar' | 'pt';
export type UserType = 'student' | 'biashara' | 'informal' | 'family' | 'other';
export type IncomeFrequency = 'daily' | 'weekly' | 'monthly' | 'irregular';
export type PaymentSource = 'cash' | 'mpesa' | 'airtel' | 'tigo' | 'bank' | 'loan';
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  source: PaymentSource;
  notes?: string;
  date: Date;
}

export interface Goal {
  id: string;
  title: string;
  emoji?: string;
  target: number;
  current: number;
  daysLeft?: number;
  deadline?: string;
  completed: boolean;
  milestonesCelebrated?: number[];
}

export interface SavingsChallenge {
  id: string;
  name: string;
  emoji: string;
  targetDays: number;
  dailyAmount: number;
  startDate: string;       // ISO string
  contributions: number[]; // one entry per day completed
  completed: boolean;
}

export interface AppState {
  language: Language;
  region: Region;
  userType: UserType | null;
  incomeFrequency: IncomeFrequency | null;
  firstGoal: Goal | null;
  transactions: Transaction[];
  goals: Goal[];
  cashBalance: number;
  mobileMoneyBalance: number;
  bankBalance: number;
  loanBalance: number;
  roundUpEnabled: boolean;
  roundUpSavings: number;
  onboardingComplete: boolean;
  emergencyMode: boolean;
  lastDailySummaryDate: string | null;
  spendingPatterns: Record<string, { amount: number; count: number; category: string; source: PaymentSource }>;
  streak: number;
  lastActiveDate: string | null;
  categoryBudgets: Record<string, number>;
  challenges: SavingsChallenge[];
  lessonProgress: string[];
  dismissedNotifications: string[];
  appLockEnabled: boolean;   // Audit Item 11 — Security: PIN lock
  appLockPin: string;        // 4-digit PIN (hashed in production with bcrypt)
  userName: string;          // Personalized greeting name
}

export interface AppContextType {
  state: AppState;
  setLanguage: (lang: Language) => void;
  setRegion: (region: Region) => void;
  setUserType: (type: UserType) => void;
  setIncomeFrequency: (freq: IncomeFrequency) => void;
  setFirstGoal: (goal: Goal) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date?: Date }) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'completed'>) => void;
  updateGoal: (id: string, amount: number) => void;
  completeOnboarding: () => void;
  getTodayIncome: () => number;
  getTodayExpenses: () => number;
  getCategorySpending: () => Record<string, number>;
  toggleEmergencyMode: () => void;
  getSmartSuggestions: () => { category: string; amount: number; source: PaymentSource }[];
  markDailySummaryShown: () => void;
  shouldShowDailySummary: () => boolean;
  clearAllData: () => void;
  setCategoryBudget: (category: string, amount: number) => void;
  deleteTransaction: (id: string) => void;
  deleteGoal: (id: string) => void;
  editTransaction: (id: string, updates: Partial<Pick<Transaction, 'amount' | 'category' | 'source' | 'notes'>>) => void;
  setLoanBalance: (amount: number) => void;
  toggleRoundUp: () => void;
  startChallenge: (c: Omit<SavingsChallenge, 'id' | 'contributions' | 'completed'>) => void;
  logChallengeDay: (id: string, amount: number) => void;
  abandonChallenge: (id: string) => void;
  completeLesson: (lessonId: string) => void;
  dismissNotification: (id: string) => void;
  setAppLockPin: (pin: string) => void;
  disableAppLock: () => void;
  setUserName: (name: string) => void;
}

const defaultState: AppState = {
  language: 'sw',
  region: 'TZ',
  userType: null,
  incomeFrequency: null,
  firstGoal: null,
  transactions: [],
  goals: [],
  cashBalance: 0,
  mobileMoneyBalance: 0,
  bankBalance: 0,
  loanBalance: 0,
  roundUpEnabled: false,
  roundUpSavings: 0,
  onboardingComplete: false,
  emergencyMode: false,
  lastDailySummaryDate: null,
  spendingPatterns: {},
  streak: 0,
  lastActiveDate: null,
  categoryBudgets: {},
  challenges: [],
  lessonProgress: [],
  dismissedNotifications: [],
  appLockEnabled: false,
  appLockPin: '',
  userName: '',
};

function loadPersistedState(): AppState {
  try {
    // Migrate from old key if needed
    const legacy = localStorage.getItem('pesaplan_v1');
    if (legacy && !localStorage.getItem('maokoto_v1')) {
      localStorage.setItem('maokoto_v1', legacy);
      localStorage.removeItem('pesaplan_v1');
    }
    const saved = localStorage.getItem('maokoto_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        transactions: (parsed.transactions || []).map((t: any) => ({
          ...t,
          date: new Date(t.date),
        })),
      };
    }
  } catch (e) {
    console.error('Failed to load persisted state', e);
  }
  return defaultState;
}

// ── PIN Security: per-install salt + 10k-round stretch ───────────────────────
function getInstallSalt(): string {
  // Migrate salt key if needed
  const legacySalt = localStorage.getItem('pesaplan_salt_v2');
  if (legacySalt && !localStorage.getItem('maokoto_salt_v2')) {
    localStorage.setItem('maokoto_salt_v2', legacySalt);
    localStorage.removeItem('pesaplan_salt_v2');
  }
  let salt = localStorage.getItem('maokoto_salt_v2');
  if (!salt) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    salt = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('maokoto_salt_v2', salt);
  }
  return salt;
}

export function hashPin(pin: string): string {
  const salt = getInstallSalt();
  let input = pin + ':' + salt;
  for (let round = 0; round < 10000; round++) {
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) + h) ^ input.charCodeAt(i);
      h = h >>> 0;
    }
    input = h.toString(36) + ':' + (round & 0xff).toString(16) + ':' + salt.slice(0, 8);
  }
  return input.slice(0, 48);
}

/** Verify PIN — handles legacy plaintext, legacy djb2 (short), and new stretched hash */
export function verifyPin(input: string, stored: string): boolean {
  if (/^\d{4}$/.test(stored)) return stored === input;   // legacy plaintext
  if (stored.length < 15) {
    // Legacy djb2 (single-pass, no salt) — re-hash inline for backward compat
    let h = 5381;
    for (let i = 0; i < input.length; i++) { h = (h * 33) ^ input.charCodeAt(i); h = h >>> 0; }
    return h.toString(36) === stored;
  }
  return hashPin(input) === stored;                       // new stretched hash
}

function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadPersistedState);

  // On first mount, pull cloud data if it is newer than local storage
  useEffect(() => {
    pullIfNewer().then(cloudJson => {
      if (!cloudJson) return;
      try {
        const parsed = JSON.parse(cloudJson);
        setState({
          ...defaultState,
          ...parsed,
          transactions: (parsed.transactions || []).map((t: any) => ({
            ...t,
            date: new Date(t.date),
          })),
        });
      } catch {}
    });
  }, []);

  // Persist to localStorage and schedule a background cloud push
  useEffect(() => {
    try {
      const json = JSON.stringify(state);
      localStorage.setItem('maokoto_v1', json);
      schedulePush(json);
    } catch (e) {
      console.error('Failed to persist state', e);
    }
  }, [state]);

  const setLanguage = (lang: Language) => {
    syncI18nLanguage(lang);
    setState(prev => ({ ...prev, language: lang }));
  };

  const setRegion = (region: Region) => {
    setState(prev => ({ ...prev, region }));
  };

  const setUserType = (type: UserType) => {
    setState(prev => ({ ...prev, userType: type }));
  };

  const setIncomeFrequency = (freq: IncomeFrequency) => {
    setState(prev => ({ ...prev, incomeFrequency: freq }));
  };

  const setFirstGoal = (goal: Goal) => {
    setState(prev => ({ ...prev, firstGoal: goal, goals: [goal] }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'> & { date?: Date }) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      date: transaction.date || new Date(),
    };

    setState(prev => {
      const newState = { ...prev, transactions: [newTransaction, ...prev.transactions] };
      
      // Update balances
      const amount = transaction.amount;
      if (transaction.type === 'income') {
        if (transaction.source === 'cash') newState.cashBalance += amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(transaction.source)) newState.mobileMoneyBalance += amount;
        else if (transaction.source === 'bank') newState.bankBalance += amount;
      } else {
        if (transaction.source === 'cash') newState.cashBalance -= amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(transaction.source)) newState.mobileMoneyBalance -= amount;
        else if (transaction.source === 'bank') newState.bankBalance -= amount;

        // Feature 8: Round-up savings
        if (prev.roundUpEnabled) {
          const roundUpTo = Math.ceil(amount / 500) * 500;
          const roundUp = roundUpTo - amount;
          if (roundUp > 0 && roundUp < 500) {
            newState.roundUpSavings = (prev.roundUpSavings || 0) + roundUp;
          }
        }
      }

      // Update streak tracking
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (prev.lastActiveDate !== today) {
        newState.streak = prev.lastActiveDate === yesterday ? prev.streak + 1 : 1;
        newState.lastActiveDate = today;
      }

      return newState;
    });
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'completed'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
    };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
  };

  const updateGoal = (id: string, amount: number) => {
    const MILESTONE_STEPS = [25, 50, 75, 100];
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(goal => {
        if (goal.id === id) {
          const newCurrent = goal.current + amount;
          const oldPct = (goal.current / goal.target) * 100;
          const newPct = (newCurrent / goal.target) * 100;
          const celebrated = goal.milestonesCelebrated ?? [];
          const newMilestones = MILESTONE_STEPS.filter(
            ms => newPct >= ms && oldPct < ms && !celebrated.includes(ms)
          );
          return {
            ...goal,
            current: newCurrent,
            completed: newCurrent >= goal.target,
            milestonesCelebrated: [...celebrated, ...newMilestones],
          };
        }
        return goal;
      }),
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, onboardingComplete: true }));
  };

  const getTodayIncome = () => {
    const today = new Date().toDateString();
    return state.transactions
      .filter(t => t.type === 'income' && t.date.toDateString() === today)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTodayExpenses = () => {
    const today = new Date().toDateString();
    return state.transactions
      .filter(t => t.type === 'expense' && t.date.toDateString() === today)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategorySpending = () => {
    return state.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  };

  const toggleEmergencyMode = () => {
    setState(prev => ({ ...prev, emergencyMode: !prev.emergencyMode }));
  };

  const getSmartSuggestions = () => {
    const today = new Date().toDateString();
    const todayExpenses = state.transactions
      .filter(t => t.type === 'expense' && t.date.toDateString() === today)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const suggestions: { category: string; amount: number; source: PaymentSource }[] = [];
    for (const category in todayExpenses) {
      const amount = todayExpenses[category];
      const source = 'cash' as PaymentSource;
      suggestions.push({ category, amount, source });
    }

    return suggestions;
  };

  const markDailySummaryShown = () => {
    const today = new Date().toISOString().split('T')[0];
    setState(prev => ({ ...prev, lastDailySummaryDate: today }));
  };

  const shouldShowDailySummary = () => {
    const today = new Date().toISOString().split('T')[0];
    return state.lastDailySummaryDate !== today;
  };

  const clearAllData = () => {
    try {
      localStorage.removeItem('maokoto_v1');
      localStorage.removeItem('pesaplan_v1'); // legacy key cleanup
    } catch (e) {}
    deleteCloudData(); // fire-and-forget
    Analytics.clearCrashLog();
    setState(defaultState);
  };

  const setCategoryBudget = (category: string, amount: number) => {
    setState(prev => ({
      ...prev,
      categoryBudgets: { ...prev.categoryBudgets, [category]: amount },
    }));
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      const newState = { ...prev, transactions: prev.transactions.filter(t => t.id !== id) };
      // Reverse balance effect
      if (tx.type === 'income') {
        if (tx.source === 'cash') newState.cashBalance -= tx.amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(tx.source)) newState.mobileMoneyBalance -= tx.amount;
        else if (tx.source === 'bank') newState.bankBalance -= tx.amount;
      } else {
        if (tx.source === 'cash') newState.cashBalance += tx.amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(tx.source)) newState.mobileMoneyBalance += tx.amount;
        else if (tx.source === 'bank') newState.bankBalance += tx.amount;
      }
      return newState;
    });
  };

  const editTransaction = (id: string, updates: Partial<Pick<Transaction, 'amount' | 'category' | 'source' | 'notes'>>) => {
    setState(prev => {
      const oldTx = prev.transactions.find(t => t.id === id);
      if (!oldTx) return prev;
      const newTx = { ...oldTx, ...updates };
      const newState = { ...prev, transactions: prev.transactions.map(t => t.id === id ? newTx : t) };
      // Reverse old effect
      if (oldTx.type === 'income') {
        if (oldTx.source === 'cash') newState.cashBalance -= oldTx.amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(oldTx.source)) newState.mobileMoneyBalance -= oldTx.amount;
        else if (oldTx.source === 'bank') newState.bankBalance -= oldTx.amount;
      } else {
        if (oldTx.source === 'cash') newState.cashBalance += oldTx.amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(oldTx.source)) newState.mobileMoneyBalance += oldTx.amount;
        else if (oldTx.source === 'bank') newState.bankBalance += oldTx.amount;
      }
      // Apply new effect
      if (newTx.type === 'income') {
        if (newTx.source === 'cash') newState.cashBalance += newTx.amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(newTx.source)) newState.mobileMoneyBalance += newTx.amount;
        else if (newTx.source === 'bank') newState.bankBalance += newTx.amount;
      } else {
        if (newTx.source === 'cash') newState.cashBalance -= newTx.amount;
        else if (['mpesa', 'airtel', 'tigo'].includes(newTx.source)) newState.mobileMoneyBalance -= newTx.amount;
        else if (newTx.source === 'bank') newState.bankBalance -= newTx.amount;
      }
      return newState;
    });
  };

  const setLoanBalance = (amount: number) => {
    setState(prev => ({ ...prev, loanBalance: amount }));
  };

  const toggleRoundUp = () => {
    setState(prev => ({ ...prev, roundUpEnabled: !prev.roundUpEnabled }));
  };

  const startChallenge = (c: Omit<SavingsChallenge, 'id' | 'contributions' | 'completed'>) => {
    const challenge: SavingsChallenge = {
      ...c,
      id: Math.random().toString(36).substr(2, 9),
      contributions: [],
      completed: false,
    };
    setState(prev => ({ ...prev, challenges: [...prev.challenges, challenge] }));
  };

  const logChallengeDay = (id: string, amount: number) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => {
        if (c.id !== id) return c;
        const newContribs = [...c.contributions, amount];
        return { ...c, contributions: newContribs, completed: newContribs.length >= c.targetDays };
      }),
    }));
  };

  const abandonChallenge = (id: string) => {
    setState(prev => ({ ...prev, challenges: prev.challenges.filter(c => c.id !== id) }));
  };

  const completeLesson = (lessonId: string) => {
    setState(prev => ({
      ...prev,
      lessonProgress: prev.lessonProgress.includes(lessonId)
        ? prev.lessonProgress
        : [...prev.lessonProgress, lessonId],
    }));
  };

  const dismissNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      dismissedNotifications: [...(prev.dismissedNotifications || []), id],
    }));
  };

  // hashPin and verifyPin are defined at module level (exported above AppProvider)
  // and are used directly by setAppLockPin below.

  const setAppLockPin = (pin: string) => {
    setState(prev => ({ ...prev, appLockPin: hashPin(pin), appLockEnabled: true }));
  };

  const disableAppLock = () => {
    setState(prev => ({ ...prev, appLockPin: '', appLockEnabled: false }));
  };

  const setUserName = (name: string) => {
    setState(prev => ({ ...prev, userName: name.trim() }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setLanguage,
        setRegion,
        setUserType,
        setIncomeFrequency,
        setFirstGoal,
        addTransaction,
        addGoal,
        updateGoal,
        completeOnboarding,
        getTodayIncome,
        getTodayExpenses,
        getCategorySpending,
        toggleEmergencyMode,
        getSmartSuggestions,
        markDailySummaryShown,
        shouldShowDailySummary,
        clearAllData,
        setCategoryBudget,
        deleteTransaction,
        deleteGoal,
        editTransaction,
        setLoanBalance,
        toggleRoundUp,
        startChallenge,
        logChallengeDay,
        abandonChallenge,
        completeLesson,
        dismissNotification,
        setAppLockPin,
        disableAppLock,
        setUserName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Import components
import { OnboardingFlow } from '@/app/components/onboarding/OnboardingFlow';
import { Dashboard } from '@/app/components/dashboard/Dashboard';
import { Toaster } from '@/app/components/ui/sonner';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { AppLock } from '@/app/components/dashboard/AppLock';

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

// App Content
function AppContent() {
  const { state, completeOnboarding } = useApp();

  // ── App Lock ────────────────────────────────────────────────────────────────
  const [isAppLocked, setIsAppLocked] = useState(() => state.appLockEnabled && state.onboardingComplete);

  useEffect(() => {
    if (state.appLockEnabled && state.onboardingComplete) {
      setIsAppLocked(true);
    }
  }, [state.appLockEnabled]);

  useEffect(() => {
    if (!state.appLockEnabled || !state.onboardingComplete) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') setIsAppLocked(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [state.appLockEnabled, state.onboardingComplete]);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.appLockEnabled || !state.onboardingComplete) return;
    const reset = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setIsAppLocked(true), INACTIVITY_MS);
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [state.appLockEnabled, state.onboardingComplete]);

  if (state.appLockEnabled && state.onboardingComplete && isAppLocked) {
    return <AppLock mode="unlock" storedPin={state.appLockPin} onUnlocked={() => setIsAppLocked(false)} />;
  }

  if (state.onboardingComplete) {
    return <Dashboard />;
  }

  return <OnboardingFlow onComplete={completeOnboarding} />;
}

// Sync system dark/light preference to <html> class for Tailwind compatibility
// The CSS @media (prefers-color-scheme: dark) handles CSS variables automatically;
// this listener ensures React re-renders and the .dark class stays in sync.
function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    apply(mq.matches);
    mq.addEventListener('change', (e) => apply(e.matches));
    return () => mq.removeEventListener('change', (e) => apply(e.matches));
  }, []);
}

// Main App
function App() {
  useSystemTheme();
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="w-full max-w-md h-screen relative overflow-hidden" style={{ background: 'var(--mk-bg)' }}>
          <AppContent />
          <Toaster position="top-center" />
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;