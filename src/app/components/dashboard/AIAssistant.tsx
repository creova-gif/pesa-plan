import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';
import { useApp } from '@/app/App';
import { t } from '@/app/utils/translations';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { formatCurrency, REGION_CONFIG } from '@/app/utils/currency';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

function generateReply(
  input: string,
  state: ReturnType<typeof useApp>['state'],
  lang: 'sw' | 'en'
): string {
  const fmt = (n: number) => formatCurrency(n, state.region);
  const lower = input.toLowerCase();
  const now = new Date();

  // ── Helpers ─────────────────────────────────────────────────────────────
  const expenses = state.transactions.filter(t => t.type === 'expense');
  const income = state.transactions.filter(t => t.type === 'income');

  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
  const thisWeekExp = expenses.filter(t => t.date >= weekStart).reduce((s, t) => s + t.amount, 0);
  const thisWeekInc = income.filter(t => t.date >= weekStart).reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  expenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
  const topCat = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const thisWeekByCategory: Record<string, number> = {};
  expenses.filter(t => t.date >= weekStart).forEach(t => {
    thisWeekByCategory[t.category] = (thisWeekByCategory[t.category] || 0) + t.amount;
  });

  const todayExp = expenses.filter(t => t.date.toDateString() === now.toDateString()).reduce((s, t) => s + t.amount, 0);
  const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;

  // ── Pattern matching — word boundaries prevent false partial matches ────
  const matches = (keywords: string[]) =>
    keywords.some(k => new RegExp(`(^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(lower) || lower.includes(k));

  // Balance / how much
  if (matches(['balance', 'bakaa', 'baki', 'how much do i have', 'nina kiasi'])) {
    return lang === 'sw'
      ? `Bakaa yako: ${fmt(totalBalance)}. 💵 Taslimu: ${fmt(state.cashBalance)}, 📱 Mobile: ${fmt(state.mobileMoneyBalance)}, 🏦 Benki: ${fmt(state.bankBalance)}.`
      : `Your balance: ${fmt(totalBalance)}. 💵 Cash: ${fmt(state.cashBalance)}, 📱 Mobile: ${fmt(state.mobileMoneyBalance)}, 🏦 Bank: ${fmt(state.bankBalance)}.`;
  }

  // Where did money go / spending
  if (matches(['where', 'wapi', 'pesa zangu', 'money go', 'spent on', 'spending', 'matumizi'])) {
    if (topCat.length === 0) {
      return lang === 'sw' ? 'Bado haujafanya matumizi yoyote.' : 'No expenses recorded yet.';
    }
    const top3 = topCat.slice(0, 3).map(([cat, amt]) => `${getCategoryIcon(cat)} ${cat}: ${fmt(amt)}`).join(', ');
    return lang === 'sw'
      ? `Matumizi makubwa: ${top3}.`
      : `Top spending categories: ${top3}.`;
  }

  // Today
  if (matches(['leo', 'today', 'siku ya leo'])) {
    const warnThreshold = REGION_CONFIG[state.region].dailyWarnThreshold;
    const isHigh = todayExp > warnThreshold;
    return lang === 'sw'
      ? `Leo umetumia ${fmt(todayExp)}. ${isHigh ? 'Angalia matumizi yako! ⚠️' : 'Uko vizuri. ✅'}`
      : `Today you spent ${fmt(todayExp)}. ${isHigh ? 'Watch your spending! ⚠️' : "You're doing well. ✅"}`;
  }

  // This week
  if (matches(['wiki', 'week', 'this week', 'wiki hii'])) {
    const net = thisWeekInc - thisWeekExp;
    return lang === 'sw'
      ? `Wiki hii: Mapato ${fmt(thisWeekInc)}, Matumizi ${fmt(thisWeekExp)}. ${net >= 0 ? `Umeokolewa ${fmt(net)} 🎉` : `Hasara ya ${fmt(Math.abs(net))} ⚠️`}`
      : `This week: Income ${fmt(thisWeekInc)}, Spent ${fmt(thisWeekExp)}. ${net >= 0 ? `Saved ${fmt(net)} 🎉` : `Overspent by ${fmt(Math.abs(net))} ⚠️`}`;
  }

  // Budget status
  if (matches(['budget', 'bajeti', 'on track', 'on budget'])) {
    const over = Object.entries(state.categoryBudgets).filter(([cat, limit]) => (byCategory[cat] || 0) > limit);
    if (over.length === 0 && Object.keys(state.categoryBudgets).length === 0) {
      return lang === 'sw' ? 'Hujaweka bajeti bado. Nenda Mipangilio → Weka Mipaka.' : 'No budget limits set yet. Go to Budget Health → Set Limits.';
    }
    if (over.length === 0) {
      return lang === 'sw' ? 'Uko kwenye bajeti. Endelea hivyo! 🎉' : "You're within budget on all categories! 🎉";
    }
    const overNames = over.map(([cat]) => `${getCategoryIcon(cat)} ${cat}`).join(', ');
    return lang === 'sw' ? `Umezidi bajeti: ${overNames}. Punguza matumizi.` : `Over budget in: ${overNames}. Try to reduce spending.`;
  }

  // Goal progress
  if (matches(['goal', 'lengo', 'target', 'save', 'akiba', 'saving'])) {
    const active = state.goals.filter(g => !g.completed);
    if (active.length === 0) return lang === 'sw' ? 'Huna malengo ya sasa.' : 'You have no active goals.';
    const g = active[0];
    const pct = Math.round((g.current / g.target) * 100);
    const remaining = g.target - g.current;
    return lang === 'sw'
      ? `Lengo "${g.title}": ${pct}% imekamilika. Imebaki ${fmt(remaining)}.`
      : `Goal "${g.title}": ${pct}% complete. ${fmt(remaining)} remaining.`;
  }

  // Specific category queries — show this-week and all-time amounts
  for (const [cat, amt] of topCat) {
    const catLower = cat.toLowerCase();
    if (lower.includes(catLower) || lower.includes(catLower.replace('&', 'and'))) {
      const budget = state.categoryBudgets[cat];
      const weekAmt = thisWeekByCategory[cat] || 0;
      const budgetInfo = budget ? (lang === 'sw' ? ` Bajeti: ${fmt(budget)}.` : ` Budget: ${fmt(budget)}.`) : '';
      return lang === 'sw'
        ? `${getCategoryIcon(cat)} ${cat}: Wiki hii ${fmt(weekAmt)}, jumla yote ${fmt(amt)}.${budgetInfo}`
        : `${getCategoryIcon(cat)} ${cat}: ${fmt(weekAmt)} this week, ${fmt(amt)} all-time.${budgetInfo}`;
    }
  }

  // Streak
  if (matches(['streak', 'mfululizo', 'days'])) {
    return lang === 'sw'
      ? `Mfululizo wako: ${state.streak} siku! ${state.streak >= 7 ? 'Hongera sana! 🔥' : 'Endelea kurekodi!'}`
      : `Your streak: ${state.streak} days! ${state.streak >= 7 ? 'Amazing! 🔥' : 'Keep logging daily!'}`;
  }

  // Net worth
  if (matches(['net worth', 'thamani', 'worth', 'assets', 'rasilimali'])) {
    const nw = (state.cashBalance + state.mobileMoneyBalance + state.bankBalance) - state.loanBalance;
    return lang === 'sw'
      ? `Thamani halisi yako: ${fmt(nw)}. Rasilimali: ${fmt(state.cashBalance + state.mobileMoneyBalance + state.bankBalance)}, Madeni: ${fmt(state.loanBalance)}.`
      : `Your net worth: ${fmt(nw)}. Assets: ${fmt(state.cashBalance + state.mobileMoneyBalance + state.bankBalance)}, Liabilities: ${fmt(state.loanBalance)}.`;
  }

  // Tip / coaching
  if (matches(['tip', 'advice', 'coaching', 'ushauri', 'nisaidie', 'help me'])) {
    const tips = {
      sw: [
        'Hifadhi 20% ya mapato yako kabla ya kutumia. Jaribu mbinu ya "ulipe mwenyewe kwanza".',
        'Tumia M-Pesa savings badala ya kutunza pesa mfukoni — zinakua kidogo.',
        'Nunua chakula sokoni badala ya supermarket — unaokoa hadi 30%.',
        'Weka bajeti kwa chakula siku ya Jumapili — inakusaidia kujua unatumia kiasi gani.',
      ],
      en: [
        'Save 20% of income before spending. Try the "pay yourself first" method.',
        'Use M-Pesa savings instead of cash — your money grows a little.',
        'Buy food at the market instead of supermarket — save up to 30%.',
        'Set a food budget every Sunday — helps you track weekly spending.',
      ],
    };
    const tip = tips[lang][Math.floor(Math.random() * tips[lang].length)];
    return `💡 ${tip}`;
  }

  // Default response
  const defaults = {
    sw: [
      `Unaweza kuniuliza: "Pesa zangu ziko wapi?", "Wiki hii nikitumia kiasi gani?", "Bajeti yangu iko sawa?", au "Nisaidie akiba".`,
      `Sina data ya kutosha kujibu hilo. Jaribu: "Ninavyotumia leo" au "Lengo langu liko wapi?"`,
    ],
    en: [
      `Try asking: "Where did my money go?", "How much did I spend this week?", "Am I on budget?", or "Give me a savings tip."`,
      `I don't have enough data for that. Try: "What did I spend today?" or "How's my goal going?"`,
    ],
  };
  return defaults[lang][Math.floor(Date.now() / 1000) % 2];
}

export function AIAssistant() {
  const { state } = useApp();
  const lang = state.language;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showPeek, setShowPeek] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = lang === 'sw'
    ? ['Pesa zangu ziko wapi?', 'Bajeti yangu iko sawa?', 'Leo nimetumia kiasi gani?', 'Lengo langu liko wapi?']
    : ["Where did my money go?", "Am I on budget?", "What did I spend today?", "How's my goal?"];

  const initMessages = (): Message[] => [{
    role: 'assistant',
    text: lang === 'sw'
      ? `Habari! Mimi ni Msaidizi wako wa Bajeti. 💬\nNiulize chochote kuhusu matumizi yako!`
      : `Hello! I'm your Budget Coach. 💬\nAsk me anything about your spending!`,
  }];

  // Peek tooltip — shows 1.8s after mount, hides after 3s
  useEffect(() => {
    if (open) return;
    const show = setTimeout(() => setShowPeek(true),  1800);
    const hide = setTimeout(() => setShowPeek(false), 4800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for open event fired by "Ask Assistant more" button in Dashboard
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setMessages(prev => prev.length === 0 ? initMessages() : prev);
    };
    window.addEventListener('maokoto:open-ai', handler);
    return () => window.removeEventListener('maokoto:open-ai', handler);
  }, [lang]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    const reply = generateReply(text, state, lang);
    const botMsg: Message = { role: 'assistant', text: reply };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <>
      {/* ── Floating AI button ─────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 z-40 flex items-center" style={{ WebkitTapHighlightColor: 'transparent' }}>

        {/* Peek tooltip */}
        <AnimatePresence>
          {showPeek && !open && (
            <motion.div
              key="peek"
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute',
                right: 70,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#1A3D2E',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.01em',
                padding: '7px 14px',
                borderRadius: 22,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 18px rgba(26,61,46,0.45)',
                pointerEvents: 'none',
              }}
            >
              {lang === 'sw' ? 'Niulize chochote! 💬' : 'Ask me anything! 💬'}
              <span style={{
                position: 'absolute',
                right: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '7px solid #1A3D2E',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          onClick={() => { setOpen(true); if (messages.length === 0) setMessages(initMessages()); }}
          aria-label="Open AI Budget Coach"
          initial={{ scale: 0, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 1 }}
          whileTap={{ scale: 0.9 }}
          style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}
        >
          {/* Soft green breathing glow */}
          <motion.span
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: 26,
              background: 'radial-gradient(ellipse at center, rgba(26,61,46,0.38) 0%, transparent 68%)',
              pointerEvents: 'none',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1.06, 0.92] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Slow-rotating shimmer ring */}
          <motion.span
            style={{
              position: 'absolute',
              inset: -1.5,
              borderRadius: 21,
              background: 'conic-gradient(from 0deg, rgba(92,199,160,0.9) 0deg, rgba(26,61,46,0.2) 90deg, rgba(92,199,160,0.0) 180deg, rgba(26,61,46,0.2) 270deg, rgba(92,199,160,0.9) 360deg)',
              pointerEvents: 'none',
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Button body — maokoto green squircle */}
          <div style={{
            position: 'absolute',
            inset: 1.5,
            borderRadius: 19,
            background: 'linear-gradient(145deg, #1A3D2E 0%, #245E42 50%, #1A3D2E 100%)',
            boxShadow: '0 6px 24px rgba(26,61,46,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            {/* Subtle inner gleam */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '42%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)',
              borderRadius: '19px 19px 0 0',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Center icon — 4-pointed sparkle */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <motion.svg
              width="26" height="26" viewBox="0 0 26 26" fill="none"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Large 4-point star */}
              <path
                d="M13 2 L14.6 10.4 L23 12 L14.6 13.6 L13 22 L11.4 13.6 L3 12 L11.4 10.4 Z"
                fill="white"
                fillOpacity="0.95"
              />
              {/* Small accent star top-right */}
              <path
                d="M20.5 3.5 L21.2 6.3 L24 7 L21.2 7.7 L20.5 10.5 L19.8 7.7 L17 7 L19.8 6.3 Z"
                fill="white"
                fillOpacity="0.5"
              />
              {/* Tiny dot bottom-left */}
              <circle cx="5.5" cy="19.5" r="1.2" fill="white" fillOpacity="0.32" />
            </motion.svg>
          </div>

          {/* Live green pulse dot — top-right */}
          <motion.span
            style={{
              position: 'absolute',
              top: 6, right: 6,
              width: 7, height: 7,
              borderRadius: '50%',
              background: '#5CC7A0',
              border: '1.5px solid #1A3D2E',
              zIndex: 2,
            }}
            animate={{ opacity: [1, 0.35, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        </motion.button>
      </div>

      {/* ── Chat sheet ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(12,20,32,0.6)', zIndex: 50, backdropFilter: 'blur(2px)' }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                borderRadius: '24px 24px 0 0',
                zIndex: 50,
                height: '78vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#F6F6F4',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.35)',
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1A3D2E 0%, #245E42 60%, #1A3D2E 100%)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                borderRadius: '24px 24px 0 0',
              }}>
                {/* Soft mint radial sweep */}
                <div style={{
                  position: 'absolute', top: -24, left: -24, width: 130, height: 130,
                  background: 'radial-gradient(circle, rgba(92,199,160,0.15) 0%, transparent 65%)',
                  pointerEvents: 'none',
                }} />
                {/* Dot grid texture */}
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.06,
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                  {/* Avatar squircle */}
                  <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
                    {/* Slow mint shimmer ring */}
                    <motion.span
                      style={{
                        position: 'absolute', inset: -1.5, borderRadius: 15,
                        background: 'conic-gradient(from 0deg, rgba(92,199,160,0.9) 0deg, rgba(26,61,46,0.1) 120deg, rgba(92,199,160,0.0) 200deg, rgba(92,199,160,0.9) 360deg)',
                        pointerEvents: 'none',
                      }}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Avatar body */}
                    <div style={{
                      position: 'absolute', inset: 2, borderRadius: 12,
                      background: 'linear-gradient(145deg, #1A3D2E, #2D6A4F)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
                        <path d="M13 2 L14.6 10.4 L23 12 L14.6 13.6 L13 22 L11.4 13.6 L3 12 L11.4 10.4 Z" fill="white" fillOpacity="0.92" />
                        <path d="M20.5 3.5 L21.2 6.3 L24 7 L21.2 7.7 L20.5 10.5 L19.8 7.7 L17 7 L19.8 6.3 Z" fill="white" fillOpacity="0.48" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '0.01em' }}>
                      {t('budgetCoach', lang)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <motion.span
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#5CC7A0',
                          display: 'inline-block',
                        }}
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                      />
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                        {t('askAboutSpending', lang)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setOpen(false)}
                  style={{
                    position: 'relative', zIndex: 1,
                    padding: 8, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* ── Messages ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: 28, height: 28, borderRadius: 9,
                        background: 'linear-gradient(145deg, #1A3D2E, #2D6A4F)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: 8, flexShrink: 0, marginTop: 2,
                        boxShadow: '0 2px 8px rgba(26,61,46,0.25)',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 26 26" fill="none">
                          <path d="M13 2 L14.6 10.4 L23 12 L14.6 13.6 L13 22 L11.4 13.6 L3 12 L11.4 10.4 Z" fill="white" fillOpacity="0.9" />
                        </svg>
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                      ...(msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, #1A3D2E, #2D6A4F)',
                            color: '#fff',
                            boxShadow: '0 4px 14px rgba(26,61,46,0.3)',
                          }
                        : {
                            background: '#fff',
                            color: '#2D2B28',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          }
                      ),
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* ── Quick questions ── */}
              {messages.length <= 1 && (
                <div style={{ padding: '0 16px 10px' }}>
                  <p style={{ fontSize: 11, color: '#928F8B', marginBottom: 8 }}>
                    {`💬 ${t('quickQuestions', lang)}`}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          background: '#EAF6F1',
                          border: '1px solid rgba(47,117,86,0.25)',
                          color: '#2F7556',
                          padding: '6px 12px',
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Input row ── */}
              <div style={{
                display: 'flex', gap: 8,
                padding: '10px 16px 20px',
                flexShrink: 0,
                borderTop: '1px solid #F4F4F2',
                background: '#F6F6F4',
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
                  placeholder={t('askMeAnything', lang)}
                  style={{
                    flex: 1,
                    border: '2px solid #F4F4F2',
                    borderRadius: 22,
                    padding: '10px 16px',
                    fontSize: 13,
                    outline: 'none',
                    background: '#fff',
                    color: '#2D2B28',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2F7556'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#F4F4F2'; }}
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  style={{
                    width: 42, height: 42,
                    borderRadius: '50%',
                    background: input.trim()
                      ? 'linear-gradient(135deg, #FD8240, #F55D3E)'
                      : '#E8E6E3',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: input.trim() ? '#fff' : '#C4C2BF',
                    flexShrink: 0,
                    cursor: input.trim() ? 'pointer' : 'default',
                    boxShadow: input.trim() ? '0 4px 14px rgba(253,130,64,0.4)' : 'none',
                    transition: 'background 0.2s, box-shadow 0.2s',
                    alignSelf: 'center',
                  }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}