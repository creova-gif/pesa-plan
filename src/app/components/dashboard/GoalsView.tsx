import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Target, Plus, Calendar, TrendingUp, Trash2, X, Trophy, Zap } from 'lucide-react';
import { useApp } from '@/app/App';
import { t } from '@/app/utils/translations';
import { toast } from 'sonner';
import { formatCurrency as fmtCurrency, REGION_CONFIG } from '@/app/utils/currency';

interface GoalsViewProps {
  onBack: () => void;
}

const GOAL_EMOJIS = ['🎯','📱','🏠','🚗','✈️','🎓','💊','💼','🎮','👗','💍','🛍️','🏖️','🎸','⚽','🍽️','💻','📷','🐾','🌱'];

const QUICK_TARGETS = [50000, 100000, 200000, 500000, 1000000];

const MILESTONE_STEPS = [25, 50, 75, 100];

function CircularRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  completed,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  completed: boolean;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(progress / 100, 1) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--mk-border)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={completed ? '#10b981' : color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </svg>
  );
}

export function GoalsView({ onBack }: GoalsViewProps) {
  const { state, addGoal, updateGoal, deleteGoal } = useApp();
  const lang = state.language;

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalEmoji, setNewGoalEmoji] = useState('🎯');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadlineDays, setNewGoalDeadlineDays] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedGoal, setCelebratedGoal] = useState('');
  const [celebrationMilestone, setCelebrationMilestone] = useState(100);
  const [swipedGoalId, setSwipedGoalId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  const fmt = (n: number) => fmtCurrency(n, state.region);
  const symbol = REGION_CONFIG[state.region].symbol;

  const QUICK_CONTRIB = REGION_CONFIG[state.region].quickAmounts.slice(0, 4);

  const ringColor = (progress: number) =>
    progress >= 100 ? '#10b981' : progress >= 75 ? '#8b5cf6' : progress >= 50 ? '#3b82f6' : '#a78bfa';

  const handleAddGoal = () => {
    if (!newGoalTitle || !newGoalTarget) return;
    const days = parseInt(newGoalDeadlineDays);
    const deadline = days > 0
      ? new Date(Date.now() + days * 86400000).toISOString()
      : undefined;

    addGoal({
      title: newGoalTitle,
      emoji: newGoalEmoji,
      target: parseInt(newGoalTarget),
      current: 0,
      daysLeft: days > 0 ? days : undefined,
      deadline,
      milestonesCelebrated: [],
    });

    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalDeadlineDays('');
    setNewGoalEmoji('🎯');
    setShowAddGoal(false);
    toast.success(t('goalAdded', lang));
  };

  const handleContribute = () => {
    if (!contributionAmount || !showContribute) return;
    const goal = state.goals.find(g => g.id === showContribute);
    if (!goal) return;

    const amount = parseInt(contributionAmount);
    const oldPct = (goal.current / goal.target) * 100;
    const newCurrent = goal.current + amount;
    const newPct = (newCurrent / goal.target) * 100;

    updateGoal(showContribute, amount);

    const celebrated = goal.milestonesCelebrated ?? [];
    const hitMilestone = MILESTONE_STEPS.find(
      ms => newPct >= ms && oldPct < ms && !celebrated.includes(ms)
    );

    if (hitMilestone !== undefined) {
      setCelebratedGoal(goal.title);
      setCelebrationMilestone(hitMilestone);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3500);
    }

    setContributionAmount('');
    setShowContribute(null);
    toast.success(t('contributionAdded', lang));
  };

  const getDailyRequired = (goal: (typeof state.goals)[0]) => {
    if (!goal.deadline) return null;
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
    if (daysLeft <= 0) return null;
    return Math.ceil((goal.target - goal.current) / daysLeft);
  };

  const getDaysLeft = (goal: (typeof state.goals)[0]) => {
    if (!goal.deadline) return null;
    return Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000));
  };

  const getProjectedDate = (goal: (typeof state.goals)[0]) => {
    const daysLeft = getDaysLeft(goal);
    if (!daysLeft) return null;
    const d = new Date();
    d.setDate(d.getDate() + daysLeft);
    return d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleGoalSwipeStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleGoalSwipeEnd = (e: React.TouchEvent, goalId: string) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -60) {
      setSwipedGoalId(goalId);
      if (navigator.vibrate) navigator.vibrate(10);
    } else if (delta > 60) {
      setSwipedGoalId(null);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirmDeleteId === goalId) {
      if (confirmDeleteTimer.current) clearTimeout(confirmDeleteTimer.current);
      deleteGoal(goalId);
      setSwipedGoalId(null);
      setConfirmDeleteId(null);
      if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
      toast.success(lang === 'sw' ? 'Lengo limefutwa' : 'Goal deleted');
    } else {
      setConfirmDeleteId(goalId);
      if (confirmDeleteTimer.current) clearTimeout(confirmDeleteTimer.current);
      confirmDeleteTimer.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const detailGoal = state.goals.find(g => g.id === showDetail);
  const totalSaved = state.goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--mk-bg)' }}>
      {/* Header */}
      <div className="text-white px-6 pb-8 min-safe-top" style={{ background: 'linear-gradient(160deg, #1a0800 0%, var(--mk-orange) 100%)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">{t('goals', lang)}</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            {lang === 'sw' ? 'Ongeza' : 'Add'}
          </motion.button>
        </div>

        {/* Summary strip */}
        {state.goals.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: lang === 'sw' ? 'Malengo' : 'Goals', value: state.goals.length },
              { label: t('done', lang), value: state.goals.filter(g => g.completed).length },
              { label: t('savedLabel', lang), value: fmt(totalSaved) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-white/70">{label}</p>
                <p className="text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      {state.goals.length > 1 && totalTarget > 0 && (
        <div className="mx-4 mt-4 bg-[var(--mk-card)] rounded-2xl p-4" style={{ border: '1px solid var(--mk-border)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[var(--mk-text-secondary)] uppercase tracking-wide">
              {lang === 'sw' ? 'Jumla ya Maendeleo' : 'Overall Progress'}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--mk-green)' }}>
              {fmt(totalSaved)} / {fmt(totalTarget)}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--mk-border)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--mk-green)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-4">
        {/* Empty state */}
        {state.goals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-14"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="text-6xl mb-4"
            >
              🎯
            </motion.div>
            <h2 className="text-lg font-bold text-[var(--mk-text)] mb-1">
              {lang === 'sw' ? 'Weka Lengo Lako' : 'Set Your First Goal'}
            </h2>
            <p className="text-sm text-[var(--mk-text-secondary)] mb-6 max-w-xs mx-auto">
              {lang === 'sw'
                ? 'Weka lengo la akiba na ufuatilie maendeleo yako kila siku.'
                : 'Create a savings goal and track your progress every day.'}
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAddGoal(true)}
              className="text-white px-8 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background: 'var(--mk-green)' }}
            >
              + {t('addGoal', lang)}
            </motion.button>
          </motion.div>
        )}

        {/* Goal cards */}
        {state.goals.map((goal, index) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const dailyRequired = getDailyRequired(goal);
          const daysLeft = getDaysLeft(goal);
          const isUrgent = daysLeft !== null && daysLeft <= 7 && !goal.completed;
          const color = ringColor(progress);

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="relative overflow-hidden rounded-2xl"
              style={{ border: '1px solid var(--mk-border)' }}
            >
              {/* Swipe-revealed delete button */}
              <AnimatePresence>
                {swipedGoalId === goal.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 top-0 h-full flex"
                  >
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className={`text-white px-5 h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                        confirmDeleteId === goal.id ? 'bg-red-700' : 'bg-red-500'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="text-xs font-bold">
                        {confirmDeleteId === goal.id ? t('confirm', lang) : t('delete', lang)}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                animate={{ x: swipedGoalId === goal.id ? -80 : 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onTouchStart={handleGoalSwipeStart}
                onTouchEnd={e => handleGoalSwipeEnd(e, goal.id)}
                className={`bg-[var(--mk-card)] ${goal.completed ? 'opacity-80' : ''}`}
              >
                {isUrgent && (
                  <div className="bg-orange-50 border-b border-orange-100 px-4 py-1.5 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600">
                      {lang === 'sw' ? `Siku ${daysLeft} zimebaki!` : `Only ${daysLeft} days left!`}
                    </span>
                  </div>
                )}

                {/* Card body — tappable to open detail */}
                <button
                  className="w-full text-left px-4 pt-4 pb-3"
                  onClick={() => {
                    setSwipedGoalId(null);
                    setShowDetail(goal.id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Circular ring */}
                    <div className="relative shrink-0">
                      <CircularRing
                        progress={progress}
                        size={72}
                        strokeWidth={7}
                        color={color}
                        completed={goal.completed}
                      />
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xl leading-none">{goal.emoji ?? '🎯'}</span>
                        <span className="text-[10px] font-black text-[var(--mk-text-secondary)] leading-tight">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-[var(--mk-text)] text-sm leading-tight truncate pr-2">{goal.title}</h3>
                        {goal.completed && (
                          <span className="text-lg shrink-0">🏆</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--mk-text-secondary)] mt-0.5">
                        {fmt(goal.current)} <span className="text-[var(--mk-text-secondary)]">/ {fmt(goal.target)}</span>
                      </p>
                      {dailyRequired !== null && dailyRequired > 0 && !goal.completed && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-[11px] text-green-700 font-semibold">
                            {lang === 'sw' ? `${fmt(dailyRequired)}/siku inahitajika` : `${fmt(dailyRequired)}/day needed`}
                          </span>
                        </div>
                      )}
                      {goal.completed && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">✅ {t('completed', lang)}</p>
                      )}
                    </div>
                  </div>

                  {/* Milestone dots */}
                  <div className="flex items-center gap-1 mt-3 mb-1">
                    {MILESTONE_STEPS.map(ms => (
                      <div
                        key={ms}
                        className={`flex-1 h-1.5 rounded-full transition-colors ${
                          progress >= ms ? 'bg-green-600' : 'bg-[var(--mk-border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between px-0.5">
                    {MILESTONE_STEPS.map(ms => (
                      <span key={ms} className={`text-[9px] font-bold ${progress >= ms ? 'text-green-600' : 'text-[var(--mk-text-secondary)]'}`}>
                        {ms}%
                      </span>
                    ))}
                  </div>
                </button>

                {!goal.completed && (
                  <div className="px-4 pb-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowContribute(goal.id)}
                      className="w-full py-2.5 bg-green-700 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition"
                    >
                      + {t('contributeNow', lang)}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Add Goal CTA (when goals exist) */}
        {state.goals.length > 0 && (
          <motion.button
            onClick={() => setShowAddGoal(true)}
            whileTap={{ scale: 0.98 }}
            className="w-full border-2 border-dashed border-purple-300 rounded-2xl p-6 flex flex-col items-center hover:border-purple-500 hover:bg-purple-50 transition"
          >
            <Plus className="w-7 h-7 text-purple-400 mb-1.5" />
            <p className="text-[var(--mk-text-secondary)] font-semibold text-sm">{t('addGoal', lang)}</p>
          </motion.button>
        )}
      </div>

      {/* ── Add Goal Sheet ── */}
      <AnimatePresence>
        {showAddGoal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowAddGoal(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--mk-card)] rounded-t-3xl z-50 border-t border-[var(--mk-border)] p-5 pb-8 max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-[var(--mk-border)] rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-4 text-[var(--mk-text)]">🎯 {t('addGoal', lang)}</h2>

              <div className="space-y-4">
                {/* Emoji + Name row */}
                <div>
                  <label className="text-xs font-semibold text-[var(--mk-text-secondary)] uppercase tracking-wide block mb-1.5">
                    {t('goalName', lang)}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEmojiPicker(v => !v)}
                      className="w-12 h-12 flex items-center justify-center text-2xl bg-purple-50 border-2 border-purple-200 rounded-xl shrink-0"
                    >
                      {newGoalEmoji}
                    </button>
                    <input
                      placeholder={lang === 'sw' ? 'Mf: Simu mpya, Ada ya shule...' : 'e.g. New phone, School fees...'}
                      value={newGoalTitle}
                      onChange={e => setNewGoalTitle(e.target.value)}
                      className="flex-1 border-2 border-[var(--mk-border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  {/* Emoji picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-2 bg-[var(--mk-bg-alt)] rounded-xl p-3 grid grid-cols-10 gap-1.5"
                      >
                        {GOAL_EMOJIS.map(em => (
                          <button
                            key={em}
                            onClick={() => { setNewGoalEmoji(em); setShowEmojiPicker(false); }}
                            className={`text-xl w-8 h-8 flex items-center justify-center rounded-lg transition ${
                              newGoalEmoji === em ? 'bg-purple-200' : 'hover:bg-[var(--mk-border)]'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Target amount */}
                <div>
                  <label className="text-xs font-semibold text-[var(--mk-text-secondary)] uppercase tracking-wide block mb-1.5">
                    {t('targetAmountLabel', lang)}
                  </label>
                  <input
                    type="number"
                    placeholder="200,000"
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
                    className="w-full border-2 border-[var(--mk-border)] rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-purple-500 transition"
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {QUICK_TARGETS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setNewGoalTarget(amt.toString())}
                        className={`px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition ${
                          newGoalTarget === amt.toString()
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-[var(--mk-border)] text-[var(--mk-text-secondary)]'
                        }`}
                      >
                        {amt >= 1000000 ? `${amt / 1000000}M` : amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="text-xs font-semibold text-[var(--mk-text-secondary)] uppercase tracking-wide block mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {t('deadlineDaysOptional', lang)}
                  </label>
                  <input
                    type="number"
                    placeholder={lang === 'sw' ? 'Mf: 90 (siku 90)' : 'e.g. 90 (days from now)'}
                    value={newGoalDeadlineDays}
                    onChange={e => setNewGoalDeadlineDays(e.target.value)}
                    className="w-full border-2 border-[var(--mk-border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition"
                  />
                  {newGoalTarget && newGoalDeadlineDays && parseInt(newGoalDeadlineDays) > 0 && (() => {
                    const daily = Math.ceil(parseInt(newGoalTarget) / parseInt(newGoalDeadlineDays));
                    return (
                      <div className="mt-2 bg-purple-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-700 shrink-0" />
                        <p className="text-xs text-purple-800 font-medium">
                          {lang === 'sw'
                            ? `Unahitaji kuokoa ${fmt(daily)} kwa siku`
                            : `You need to save ${fmt(daily)} per day`}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className="flex-1 py-3.5 border-2 border-[var(--mk-border)] rounded-2xl text-[var(--mk-text-secondary)] font-semibold text-sm"
                  >
                    {t('cancel', lang)}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddGoal}
                    disabled={!newGoalTitle || !newGoalTarget}
                    className="flex-1 py-3.5 bg-green-700 text-white rounded-2xl font-bold text-sm disabled:opacity-40"
                  >
                    {t('save', lang)}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Contribute Sheet ── */}
      <AnimatePresence>
        {showContribute && (() => {
          const goal = state.goals.find(g => g.id === showContribute);
          if (!goal) return null;
          const remaining = goal.target - goal.current;
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50"
                onClick={() => setShowContribute(null)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-[var(--mk-card)] rounded-t-3xl z-50 border-t border-[var(--mk-border)] p-5 pb-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-[var(--mk-border)] rounded-full mx-auto mb-4" />
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{goal.emoji ?? '🎯'}</span>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--mk-text)]">{goal.title}</h2>
                    <p className="text-xs text-green-700 font-medium">
                      {t('goalRemaining', lang)}: {fmt(remaining)} · {progress.toFixed(0)}% {lang === 'sw' ? 'imekamilika' : 'done'}
                    </p>
                  </div>
                </div>

                {/* Mini ring */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-20 h-20">
                    <CircularRing progress={progress} size={80} strokeWidth={7} color={ringColor(progress)} completed={goal.completed} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black text-[var(--mk-text)]">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center border-2 border-purple-500 rounded-2xl mb-4 overflow-hidden">
                  <span className="px-3 text-sm text-[var(--mk-text-secondary)]">{symbol}</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={contributionAmount}
                    onChange={e => setContributionAmount(e.target.value)}
                    className="flex-1 py-3 text-2xl font-black text-[var(--mk-text)] outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 mb-5">
                  {QUICK_CONTRIB.map(a => (
                    <button
                      key={a}
                      onClick={() => setContributionAmount(a.toString())}
                      className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition ${
                        contributionAmount === a.toString()
                          ? 'border-purple-600 bg-purple-50 text-purple-800'
                          : 'border-[var(--mk-border)] text-[var(--mk-text-secondary)]'
                      }`}
                    >
                      {a >= 1000 ? `${a / 1000}k` : a}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowContribute(null)}
                    className="flex-1 py-3.5 border-2 border-[var(--mk-border)] rounded-2xl text-[var(--mk-text-secondary)] font-semibold text-sm"
                  >
                    {t('cancel', lang)}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleContribute}
                    disabled={!contributionAmount || parseInt(contributionAmount) <= 0}
                    className="flex-1 py-3.5 bg-green-700 text-white rounded-2xl font-bold text-sm disabled:opacity-40"
                  >
                    {t('contributeNow', lang)}
                  </motion.button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── Goal Detail Sheet ── */}
      <AnimatePresence>
        {showDetail && detailGoal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowDetail(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--mk-card)] rounded-t-3xl z-50 border-t border-[var(--mk-border)] max-h-[88vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[var(--mk-card)] px-5 pt-5 pb-3 border-b border-[var(--mk-border)]">
                <div className="w-10 h-1 bg-[var(--mk-border)] rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{detailGoal.emoji ?? '🎯'}</span>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--mk-text)]">{detailGoal.title}</h2>
                      {detailGoal.completed && (
                        <span className="text-xs text-emerald-600 font-semibold">✅ {t('completed', lang)}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-[var(--mk-border)] rounded-full">
                    <X className="w-5 h-5 text-[var(--mk-text-secondary)]" />
                  </button>
                </div>
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Big circular ring */}
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36">
                    <CircularRing
                      progress={Math.min((detailGoal.current / detailGoal.target) * 100, 100)}
                      size={144}
                      strokeWidth={12}
                      color={ringColor(Math.min((detailGoal.current / detailGoal.target) * 100, 100))}
                      completed={detailGoal.completed}
                    />
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-black text-[var(--mk-text)]">
                        {Math.min((detailGoal.current / detailGoal.target) * 100, 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-[var(--mk-text-secondary)]">{lang === 'sw' ? 'imekamilika' : 'complete'}</span>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: lang === 'sw' ? 'Imeokolewa' : 'Saved',
                      value: fmt(detailGoal.current),
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50',
                    },
                    {
                      label: lang === 'sw' ? 'Lengo' : 'Target',
                      value: fmt(detailGoal.target),
                      color: 'text-green-700',
                      bg: 'bg-purple-50',
                    },
                    {
                      label: lang === 'sw' ? 'Iliyobaki' : 'Remaining',
                      value: fmt(Math.max(0, detailGoal.target - detailGoal.current)),
                      color: 'text-orange-600',
                      bg: 'bg-orange-50',
                    },
                    getDailyRequired(detailGoal) && !detailGoal.completed
                      ? {
                          label: lang === 'sw' ? 'Kwa Siku' : 'Per Day',
                          value: fmt(getDailyRequired(detailGoal)!),
                          color: 'text-blue-600',
                          bg: 'bg-blue-50',
                        }
                      : {
                          label: lang === 'sw' ? 'Siku Zilizobaki' : 'Days Left',
                          value: getDaysLeft(detailGoal) !== null ? `${getDaysLeft(detailGoal)}` : '—',
                          color: 'text-[var(--mk-text-secondary)]',
                          bg: 'bg-[var(--mk-bg-alt)]',
                        },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4`}>
                      <p className="text-xs text-[var(--mk-text-secondary)] mb-1">{label}</p>
                      <p className={`text-base font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Projected date */}
                {getProjectedDate(detailGoal) && !detailGoal.completed && (
                  <div className="flex items-center gap-3 bg-[var(--mk-bg-alt)] rounded-2xl p-4">
                    <Calendar className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--mk-text-secondary)]">{lang === 'sw' ? 'Tarehe ya Mwisho' : 'Deadline'}</p>
                      <p className="text-sm font-bold text-[var(--mk-text)]">{getProjectedDate(detailGoal)}</p>
                    </div>
                  </div>
                )}

                {/* Milestones */}
                <div>
                  <p className="text-xs font-semibold text-[var(--mk-text-secondary)] uppercase tracking-wide mb-3">
                    {lang === 'sw' ? 'Hatua za Maendeleo' : 'Progress Milestones'}
                  </p>
                  <div className="space-y-2">
                    {MILESTONE_STEPS.map(ms => {
                      const reached = (detailGoal.current / detailGoal.target) * 100 >= ms;
                      return (
                        <div key={ms} className={`flex items-center gap-3 p-3 rounded-xl ${reached ? 'bg-emerald-50' : 'bg-[var(--mk-bg-alt)]'}`}>
                          <span className="text-lg">{reached ? '✅' : '⬜'}</span>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${reached ? 'text-emerald-700' : 'text-[var(--mk-text-secondary)]'}`}>
                              {ms}% — {fmt(Math.round(detailGoal.target * ms / 100))}
                            </p>
                          </div>
                          {reached && <Trophy className="w-4 h-4 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                {!detailGoal.completed && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowDetail(null); setShowContribute(detailGoal.id); }}
                    className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold"
                  >
                    + {t('contributeNow', lang)}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Milestone Celebration overlay ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-8"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-[var(--mk-card)] rounded-3xl p-8 text-center max-w-sm w-full" style={{ border: '1px solid var(--mk-border)' }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-6xl mb-4"
              >
                {celebrationMilestone === 100 ? '🏆' : celebrationMilestone === 75 ? '🥳' : celebrationMilestone === 50 ? '🎉' : '⭐'}
              </motion.div>
              <h2 className="text-2xl font-black text-[var(--mk-text)] mb-1">
                {celebrationMilestone === 100 ? t('congratulations', lang) : `${celebrationMilestone}%!`}
              </h2>
              <p className="text-sm text-[var(--mk-text-secondary)]">
                {celebrationMilestone === 100
                  ? (lang === 'sw' ? `Umefika lengo lako la "${celebratedGoal}"!` : `You've reached your goal "${celebratedGoal}"!`)
                  : (lang === 'sw'
                    ? `Umefika ${celebrationMilestone}% ya lengo lako la "${celebratedGoal}"! Endelea!`
                    : `You hit ${celebrationMilestone}% of "${celebratedGoal}"! Keep going!`)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
