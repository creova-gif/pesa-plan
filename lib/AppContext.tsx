import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Region } from '@/utils/currency';

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
  date: string; // ISO string in RN (no Date serialization issues)
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
  startDate: string;
  contributions: number[];
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
  streak: number;
  lastActiveDate: string | null;
  categoryBudgets: Record<string, number>;
  challenges: SavingsChallenge[];
  lessonProgress: string[];
  dismissedNotifications: string[];
  appLockEnabled: boolean;
  appLockPin: string;
  userName: string;
}

interface AppContextType {
  state: AppState;
  loaded: boolean;
  setLanguage: (lang: Language) => void;
  setRegion: (region: Region) => void;
  setUserType: (type: UserType) => void;
  setIncomeFrequency: (freq: IncomeFrequency) => void;
  setFirstGoal: (goal: Goal) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'date'> & { date?: string }) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'completed'>) => void;
  updateGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  deleteTransaction: (id: string) => void;
  editTransaction: (id: string, updates: Partial<Pick<Transaction, 'amount' | 'category' | 'source' | 'notes'>>) => void;
  completeOnboarding: () => void;
  getTodayIncome: () => number;
  getTodayExpenses: () => number;
  getCategorySpending: () => Record<string, number>;
  toggleEmergencyMode: () => void;
  markDailySummaryShown: () => void;
  shouldShowDailySummary: () => boolean;
  clearAllData: () => void;
  setCategoryBudget: (category: string, amount: number) => void;
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

const STORAGE_KEY = 'maokoto_v1';
const SALT_KEY = 'maokoto_salt_v2';

function getInstallSalt(): string {
  // Sync version only — full async version would need a hook
  return 'maokoto_default_salt_rn';
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

export function verifyPin(input: string, stored: string): boolean {
  if (/^\d{4}$/.test(stored)) return stored === input;
  if (stored.length < 15) {
    let h = 5381;
    for (let i = 0; i < input.length; i++) { h = (h * 33) ^ input.charCodeAt(i); h = h >>> 0; }
    return h.toString(36) === stored;
  }
  return hashPin(input) === stored;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        // Migrate from web keys if present
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setState(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
      } catch (e) {
        console.error('Failed to load state', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist on every state change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const today = () => new Date().toISOString().split('T')[0];
  const todayStr = () => new Date().toDateString();

  const setLanguage = (lang: Language) => setState(p => ({ ...p, language: lang }));
  const setRegion = (region: Region) => setState(p => ({ ...p, region }));
  const setUserType = (type: UserType) => setState(p => ({ ...p, userType: type }));
  const setIncomeFrequency = (freq: IncomeFrequency) => setState(p => ({ ...p, incomeFrequency: freq }));
  const setFirstGoal = (goal: Goal) => setState(p => ({ ...p, firstGoal: goal, goals: [goal] }));
  const setUserName = (name: string) => setState(p => ({ ...p, userName: name.trim() }));
  const completeOnboarding = () => setState(p => ({ ...p, onboardingComplete: true }));
  const toggleEmergencyMode = () => setState(p => ({ ...p, emergencyMode: !p.emergencyMode }));
  const toggleRoundUp = () => setState(p => ({ ...p, roundUpEnabled: !p.roundUpEnabled }));
  const setLoanBalance = (amount: number) => setState(p => ({ ...p, loanBalance: amount }));
  const setAppLockPin = (pin: string) => setState(p => ({ ...p, appLockPin: hashPin(pin), appLockEnabled: true }));
  const disableAppLock = () => setState(p => ({ ...p, appLockPin: '', appLockEnabled: false }));
  const setCategoryBudget = (category: string, amount: number) =>
    setState(p => ({ ...p, categoryBudgets: { ...p.categoryBudgets, [category]: amount } }));
  const deleteGoal = (id: string) => setState(p => ({ ...p, goals: p.goals.filter(g => g.id !== id) }));
  const completeLesson = (id: string) => setState(p => ({
    ...p, lessonProgress: p.lessonProgress.includes(id) ? p.lessonProgress : [...p.lessonProgress, id],
  }));
  const dismissNotification = (id: string) => setState(p => ({
    ...p, dismissedNotifications: [...(p.dismissedNotifications || []), id],
  }));

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'> & { date?: string }) => {
    const newTx: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      date: transaction.date || new Date().toISOString(),
    };

    setState(prev => {
      const next = { ...prev, transactions: [newTx, ...prev.transactions] };
      const { amount, type, source } = transaction;

      const updateBalance = (delta: number) => {
        if (source === 'cash') next.cashBalance += delta;
        else if (['mpesa', 'airtel', 'tigo'].includes(source)) next.mobileMoneyBalance += delta;
        else if (source === 'bank') next.bankBalance += delta;
      };

      if (type === 'income') updateBalance(amount);
      else {
        updateBalance(-amount);
        if (prev.roundUpEnabled) {
          const roundUpTo = Math.ceil(amount / 500) * 500;
          const roundUp = roundUpTo - amount;
          if (roundUp > 0 && roundUp < 500) next.roundUpSavings = (prev.roundUpSavings || 0) + roundUp;
        }
      }

      const tod = today();
      const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (prev.lastActiveDate !== tod) {
        next.streak = prev.lastActiveDate === yest ? prev.streak + 1 : 1;
        next.lastActiveDate = tod;
      }
      return next;
    });
  };

  const deleteTransaction = (id: string) => setState(prev => {
    const tx = prev.transactions.find(t => t.id === id);
    if (!tx) return prev;
    const next = { ...prev, transactions: prev.transactions.filter(t => t.id !== id) };
    const { amount, type, source } = tx;
    const delta = type === 'income' ? -amount : amount;
    if (source === 'cash') next.cashBalance += delta;
    else if (['mpesa', 'airtel', 'tigo'].includes(source)) next.mobileMoneyBalance += delta;
    else if (source === 'bank') next.bankBalance += delta;
    return next;
  });

  const editTransaction = (id: string, updates: Partial<Pick<Transaction, 'amount' | 'category' | 'source' | 'notes'>>) =>
    setState(prev => {
      const old = prev.transactions.find(t => t.id === id);
      if (!old) return prev;
      const updated = { ...old, ...updates };
      const next = { ...prev, transactions: prev.transactions.map(t => t.id === id ? updated : t) };
      // Reverse old, apply new
      const applyDelta = (tx: Transaction, sign: number) => {
        const d = tx.amount * sign * (tx.type === 'income' ? 1 : -1);
        if (tx.source === 'cash') next.cashBalance += d;
        else if (['mpesa', 'airtel', 'tigo'].includes(tx.source)) next.mobileMoneyBalance += d;
        else if (tx.source === 'bank') next.bankBalance += d;
      };
      applyDelta(old, -1);
      applyDelta(updated, 1);
      return next;
    });

  const addGoal = (goal: Omit<Goal, 'id' | 'completed'>) =>
    setState(p => ({
      ...p,
      goals: [...p.goals, { ...goal, id: Math.random().toString(36).substr(2, 9), completed: false }],
    }));

  const updateGoal = (id: string, amount: number) => {
    const MILESTONES = [25, 50, 75, 100];
    setState(p => ({
      ...p,
      goals: p.goals.map(g => {
        if (g.id !== id) return g;
        const newCurrent = g.current + amount;
        const oldPct = (g.current / g.target) * 100;
        const newPct = (newCurrent / g.target) * 100;
        const celebrated = g.milestonesCelebrated ?? [];
        return {
          ...g,
          current: newCurrent,
          completed: newCurrent >= g.target,
          milestonesCelebrated: [
            ...celebrated,
            ...MILESTONES.filter(ms => newPct >= ms && oldPct < ms && !celebrated.includes(ms)),
          ],
        };
      }),
    }));
  };

  const getTodayIncome = () =>
    state.transactions
      .filter(t => t.type === 'income' && new Date(t.date).toDateString() === todayStr())
      .reduce((s, t) => s + t.amount, 0);

  const getTodayExpenses = () =>
    state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date).toDateString() === todayStr())
      .reduce((s, t) => s + t.amount, 0);

  const getCategorySpending = () =>
    state.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {} as Record<string, number>);

  const markDailySummaryShown = () => setState(p => ({ ...p, lastDailySummaryDate: today() }));
  const shouldShowDailySummary = () => state.lastDailySummaryDate !== today();

  const clearAllData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setState(defaultState);
  };

  const startChallenge = (c: Omit<SavingsChallenge, 'id' | 'contributions' | 'completed'>) =>
    setState(p => ({
      ...p,
      challenges: [...p.challenges, { ...c, id: Math.random().toString(36).substr(2, 9), contributions: [], completed: false }],
    }));

  const logChallengeDay = (id: string, amount: number) =>
    setState(p => ({
      ...p,
      challenges: p.challenges.map(c => {
        if (c.id !== id) return c;
        const contributions = [...c.contributions, amount];
        return { ...c, contributions, completed: contributions.length >= c.targetDays };
      }),
    }));

  const abandonChallenge = (id: string) => setState(p => ({ ...p, challenges: p.challenges.filter(c => c.id !== id) }));

  return (
    <AppContext.Provider value={{
      state, loaded,
      setLanguage, setRegion, setUserType, setIncomeFrequency, setFirstGoal, setUserName,
      addTransaction, addGoal, updateGoal, deleteGoal, deleteTransaction, editTransaction,
      completeOnboarding, getTodayIncome, getTodayExpenses, getCategorySpending,
      toggleEmergencyMode, markDailySummaryShown, shouldShowDailySummary,
      clearAllData, setCategoryBudget, setLoanBalance, toggleRoundUp,
      startChallenge, logChallengeDay, abandonChallenge,
      completeLesson, dismissNotification,
      setAppLockPin, disableAppLock,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
