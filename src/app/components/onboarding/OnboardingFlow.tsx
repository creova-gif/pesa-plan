import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check } from 'lucide-react';
import { useApp, type Language, type UserType, type IncomeFrequency } from '@/app/App';
import { REGION_CONFIG, type Region } from '@/app/utils/currency';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ── Subtle dot-grid background ─────────────────────────────────────────────
function BackgroundPattern() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  );
}

// ── Thin progress bar ──────────────────────────────────────────────────────
function ProgressBar({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 items-center flex-1">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="h-[2px] rounded-full flex-1"
          animate={{ backgroundColor: i <= current ? '#16a34a' : 'rgba(255,255,255,0.15)' }}
          transition={{ duration: 0.25 }}
        />
      ))}
    </div>
  );
}

// ── Slide variants ─────────────────────────────────────────────────────────
const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── Unified card style helpers ─────────────────────────────────────────────
const cardBase = 'relative overflow-hidden rounded-2xl text-left transition-colors duration-200';
const cardIdle = 'bg-white/[0.06] border border-white/[0.10]';
const cardOn   = 'bg-green-600/[0.14] border border-green-500/[0.55]';

// ── App icon ───────────────────────────────────────────────────────────────
function AppIcon() {
  return (
    <div
      className="w-[76px] h-[76px] rounded-[22px] flex items-center justify-center"
      style={{ background: '#16a34a', boxShadow: '0 20px 50px rgba(22,163,74,0.35)' }}
    >
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
        <circle cx="19" cy="16" r="9" stroke="white" strokeWidth="2.5" />
        <path d="M16 16h6M19 13v6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M19 25v8M15 30l4 3 4-3"
          stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Step 0: Welcome ────────────────────────────────────────────────────────
function WelcomeStep({ onNext, lang }: { onNext: () => void; lang: Language }) {
  const features = [
    {
      icon: '📲',
      en: 'M-Pesa · Airtel · Tigo',    subEn: 'All mobile money supported',
      sw: 'M-Pesa · Airtel · Tigo',    subSw: 'Pesa za simu zote',
    },
    {
      icon: '📊',
      en: 'AI budgeting',              subEn: 'Smart spending insights',
      sw: 'Bajeti ya AI',              subSw: 'Akili bandia inakusaidia',
    },
    {
      icon: '🔒',
      en: '100% private',              subEn: 'Data stays on your device',
      sw: 'Faragha kamili',            subSw: 'Data kwenye simu yako tu',
    },
  ];

  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
          className="mb-7"
        >
          <AppIcon />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-black text-white tracking-tight text-center mb-2"
        >
          PesaPlan
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.3 }}
          className="text-white text-sm text-center mb-10 leading-relaxed"
          style={{ maxWidth: 230 }}
        >
          {lang === 'sw' ? 'Dhibiti pesa zako, usiogope' : 'Control your money, not fear it'}
        </motion.p>

        <div className="w-full max-w-sm space-y-2.5">
          {features.map((f, i) => (
            <motion.div
              key={f.en}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1, type: 'spring', stiffness: 300, damping: 26 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-xl shrink-0">{f.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold leading-tight">{lang === 'sw' ? f.sw : f.en}</p>
                <p className="text-white/40 text-xs mt-0.5">{lang === 'sw' ? f.subSw : f.subEn}</p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.25)' }}>
                <Check className="w-3 h-3 text-green-400" strokeWidth={2.5} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto mt-8">
        <motion.button
          onClick={onNext}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileTap={{ scale: 0.97 }}
          className="w-full text-white rounded-2xl py-4 font-bold text-base transition-colors"
          style={{ background: '#16a34a' }}
        >
          {lang === 'sw' ? 'Anza Sasa' : 'Get Started'}
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.28 }}
          transition={{ delay: 0.9 }}
          className="text-white text-center text-xs mt-3"
        >
          {lang === 'sw' ? 'Bila malipo · Bila matangazo · Bila mtandao' : 'Free · No ads · Works offline'}
        </motion.p>
      </div>
    </div>
  );
}

// ── Step 1: Language ───────────────────────────────────────────────────────
function LanguageStep({ onPick }: { onPick: (l: Language) => void }) {
  const [picked, setPicked] = useState<Language | null>(null);
  const handle = (l: Language) => {
    setPicked(l);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(l), 320);
  };

  const options = [
    { code: 'sw' as Language, name: 'Kiswahili', flag: '🇹🇿', sub: 'Lugha ya kwanza ya Afrika Mashariki' },
    { code: 'en' as Language, name: 'English',   flag: '🇬🇧', sub: 'International language' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.45, y: 0 }}
        className="text-white text-sm text-center mb-2">
        Choose your language
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="text-3xl font-black text-white text-center mb-8">
        Habari? / Hello!
      </motion.h2>

      <div className="w-full max-w-sm space-y-3">
        {options.map((l, i) => {
          const isSelected = picked === l.code;
          return (
            <motion.button
              key={l.code}
              onClick={() => handle(l.code)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              className={`${cardBase} w-full ${isSelected ? cardOn : cardIdle}`}
              style={{ minHeight: 88 }}
            >
              <div className="flex items-center gap-4 px-5 py-5">
                <span className="text-4xl shrink-0">{l.flag}</span>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg leading-tight">{l.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{l.sub}</p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#16a34a' }}>
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Name ───────────────────────────────────────────────────────────
function NameStep({ onNext, lang, initialName }: { onNext: (name: string) => void; lang: Language; initialName: string }) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 400); }, []);
  const displayName = name.trim() || (lang === 'sw' ? 'Rafiki' : 'Friend');

  return (
    <div className="flex flex-col items-center h-full px-6 pt-10 pb-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <motion.div
          animate={{ rotate: [0, 15, -10, 15, 0] }}
          transition={{ delay: 0.2, duration: 1.2 }}
          className="text-5xl mb-6"
        >
          👋
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-white text-center mb-1">
          {lang === 'sw' ? 'Jina lako ni nani?' : "What's your name?"}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: 0.1 }}
          className="text-white text-sm text-center mb-7">
          {lang === 'sw' ? 'Tunataka kukusalimu vizuri' : "We'd love to greet you personally"}
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.p key={displayName}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="text-xl font-bold mb-6 text-center" style={{ color: '#4ade80' }}>
            {lang === 'sw' ? `Karibu, ${displayName}!` : `Hi, ${displayName}!`}
          </motion.p>
        </AnimatePresence>

        <motion.input
          ref={inputRef}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          type="text" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onNext(name.trim()); }}
          maxLength={30}
          placeholder={lang === 'sw' ? 'Andika jina lako...' : 'Type your name...'}
          className="w-full text-center text-xl font-semibold bg-white/[0.07] border border-white/[0.14] text-white rounded-2xl px-5 py-4 outline-none placeholder:text-white/20 transition-colors"
          style={{ '--tw-ring-color': '#16a34a' } as React.CSSProperties}
          onFocus={e => (e.target.style.borderColor = 'rgba(22,163,74,0.7)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.14)')}
        />
        <p className="text-white/25 text-xs mt-2 text-center">
          {lang === 'sw' ? 'Au bonyeza Endelea bila jina' : 'Or continue without a name'}
        </p>
      </div>

      <motion.button
        onClick={() => onNext(name.trim())}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-sm text-white rounded-2xl py-4 font-bold text-base transition-colors"
        style={{ background: '#16a34a' }}>
        {lang === 'sw' ? 'Endelea' : 'Continue'}
      </motion.button>
    </div>
  );
}

// ── Step 3: Region ─────────────────────────────────────────────────────────
const REGIONS: { code: Region }[] = [
  { code: 'TZ' }, { code: 'KE' }, { code: 'UG' }, { code: 'RW' }, { code: 'BI' },
];

function RegionStep({ onPick, lang }: { onPick: (r: Region) => void; lang: Language }) {
  const [picked, setPicked] = useState<Region | null>(null);
  const handle = (code: Region) => {
    setPicked(code);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(code), 320);
  };

  return (
    <div className="flex flex-col items-center h-full px-6 pt-8 pb-6">
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Uko wapi?' : 'Where are you?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-6">
        {lang === 'sw' ? 'Tutapanga sarafu sahihi kwa nchi yako' : "We'll set the right currency for your country"}
      </motion.p>

      <div className="w-full max-w-sm flex flex-col gap-2.5">
        {REGIONS.map(({ code }, i) => {
          const cfg = REGION_CONFIG[code];
          const isSelected = picked === code;
          return (
            <motion.button key={code} onClick={() => handle(code)}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }} whileTap={{ scale: 0.98 }}
              className={`${cardBase} w-full ${isSelected ? cardOn : cardIdle}`}
              style={{ minHeight: 68 }}>
              <div className="flex items-center gap-4 px-4 py-4">
                <span className="text-3xl shrink-0">{cfg.flag}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-base leading-tight">{lang === 'sw' ? cfg.nameSw : cfg.nameEn}</p>
                  <p className="text-white/35 text-xs">{cfg.currency} · {cfg.symbol}</p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#16a34a' }}>
                      <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: User Type ──────────────────────────────────────────────────────
type UserTypeConfig = {
  type: UserType; emoji: string;
  en: string; sw: string; subEn: string; subSw: string;
};
const USER_TYPES: UserTypeConfig[] = [
  { type: 'student',  emoji: '🎓', en: 'Student / Youth',   sw: 'Mwanafunzi / Kijana',   subEn: 'Stipends & school fees',   subSw: 'Posho na ada za shule' },
  { type: 'biashara', emoji: '🏪', en: 'Business owner',    sw: 'Mmiliki wa Biashara',   subEn: 'Business cash flow',       subSw: 'Mzunguko wa pesa biashara' },
  { type: 'informal', emoji: '🔧', en: 'Informal worker',   sw: 'Mfanyakazi wa Kawaida', subEn: 'Daily wages & gigs',       subSw: 'Mishahara ya kila siku' },
  { type: 'family',   emoji: '🏠', en: 'Family planner',    sw: 'Mpangaji wa Familia',   subEn: 'Household budget',         subSw: 'Bajeti ya familia' },
  { type: 'other',    emoji: '✨', en: 'Other',             sw: 'Nyingine',              subEn: 'Custom tracking',          subSw: 'Ufuatiliaji maalum' },
];

function UserTypeStep({ onPick, lang }: { onPick: (t: UserType) => void; lang: Language }) {
  const [picked, setPicked] = useState<UserType | null>(null);
  const handle = (type: UserType) => {
    setPicked(type);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(type), 340);
  };

  return (
    <div className="flex flex-col items-center h-full px-6 pt-8 pb-6">
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Nani wewe?' : 'Who are you?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-6">
        {lang === 'sw' ? 'Tunaboresha uzoefu wako' : 'We personalise your experience'}
      </motion.p>

      <div className="w-full max-w-sm grid grid-cols-2 gap-2.5">
        {USER_TYPES.map(({ type, emoji, en, sw: sw_, subEn, subSw }, i) => {
          const isLast = i === USER_TYPES.length - 1;
          const isSelected = picked === type;
          return (
            <motion.button key={type} onClick={() => handle(type)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }} whileTap={{ scale: 0.96 }}
              className={`${cardBase} ${isLast ? 'col-span-2' : ''} ${isSelected ? cardOn : cardIdle}`}
              style={{ minHeight: isLast ? 72 : 110 }}>
              <div className={`flex ${isLast ? 'flex-row items-center gap-3 px-4 py-4' : 'flex-col justify-between p-4'} h-full relative`}>
                <span className={`text-2xl ${isLast ? '' : 'mb-auto'}`}>{emoji}</span>
                <div className={isLast ? 'flex-1' : 'mt-2'}>
                  <p className="text-white font-semibold text-sm leading-tight">{lang === 'sw' ? sw_ : en}</p>
                  <p className="text-white/35 text-xs mt-0.5">{lang === 'sw' ? subSw : subEn}</p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#16a34a' }}>
                      <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Income Frequency ───────────────────────────────────────────────
type FreqConfig = {
  freq: IncomeFrequency; emoji: string;
  en: string; sw: string; subEn: string; subSw: string; tagEn: string; tagSw: string;
};
const FREQS: FreqConfig[] = [
  { freq: 'daily',     emoji: '☀️', en: 'Daily income',    sw: 'Mapato ya kila siku',    subEn: 'Market traders · hawkers',   subSw: 'Wachuuzi · mafundi',      tagEn: 'Every day',   tagSw: 'Kila siku' },
  { freq: 'weekly',    emoji: '📅', en: 'Weekly income',   sw: 'Mapato ya kila wiki',    subEn: 'Casual workers · drivers',   subSw: 'Wafanyakazi wa muda',      tagEn: 'Every week',  tagSw: 'Kila wiki' },
  { freq: 'monthly',   emoji: '💼', en: 'Monthly salary',  sw: 'Mshahara wa kila mwezi', subEn: 'Employed · salaried',        subSw: 'Wafanyakazi wa kudumu',    tagEn: 'Every month', tagSw: 'Kila mwezi' },
  { freq: 'irregular', emoji: '🔀', en: 'Irregular (mix)', sw: 'Mchanganyiko',           subEn: 'Freelancers · farmers',      subSw: 'Wakulima · kazi za muda',  tagEn: 'Varies',      tagSw: 'Hutofautiana' },
];

function IncomeStep({ onPick, lang }: { onPick: (f: IncomeFrequency) => void; lang: Language }) {
  const [picked, setPicked] = useState<IncomeFrequency | null>(null);
  const handle = (freq: IncomeFrequency) => {
    setPicked(freq);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(freq), 340);
  };

  return (
    <div className="flex flex-col items-center h-full px-6 pt-8 pb-6">
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Unapata pesa vipi?' : 'How do you earn?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-6">
        {lang === 'sw' ? 'Hii inasaidia kutabiri mwenendo wa pesa' : 'Helps us forecast your cash flow'}
      </motion.p>

      <div className="w-full max-w-sm flex flex-col gap-2.5">
        {FREQS.map(({ freq, emoji, en, sw: sw_, subEn, subSw, tagEn, tagSw }, i) => {
          const isSelected = picked === freq;
          return (
            <motion.button key={freq} onClick={() => handle(freq)}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }} whileTap={{ scale: 0.98 }}
              className={`${cardBase} w-full ${isSelected ? cardOn : cardIdle}`}
              style={{ minHeight: 76 }}>
              <div className="flex items-center gap-3 px-4 py-4">
                <span className="text-2xl shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight">{lang === 'sw' ? sw_ : en}</p>
                  <p className="text-white/35 text-xs mt-0.5">{lang === 'sw' ? subSw : subEn}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  isSelected ? 'text-green-300' : 'bg-white/[0.07] text-white/35'
                }`}
                  style={isSelected ? { background: 'rgba(22,163,74,0.25)' } : {}}>
                  {lang === 'sw' ? tagSw : tagEn}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 6: Goal Setup ─────────────────────────────────────────────────────
type GoalOption = { id: string; emoji: string; en: string; sw: string };
const GOAL_OPTIONS: GoalOption[] = [
  { id: 'schoolFees',    emoji: '🎓', en: 'School fees',    sw: 'Ada za shule' },
  { id: 'bills',         emoji: '💡', en: 'Bills & rent',   sw: 'Bili na kodi' },
  { id: 'emergencyFund', emoji: '🛡️', en: 'Emergency fund', sw: 'Akiba ya dharura' },
  { id: 'data',          emoji: '📱', en: 'Data & airtime', sw: 'Data na muda' },
  { id: 'travel',        emoji: '✈️', en: 'Travel savings', sw: 'Akiba ya safari' },
  { id: 'custom',        emoji: '⭐', en: 'My own goal',    sw: 'Lengo langu' },
];
const GOAL_DEFAULTS: Record<string, Record<string, number>> = {
  TZ: { schoolFees: 500000, bills: 200000, emergencyFund: 300000, data: 50000, travel: 1000000 },
  KE: { schoolFees: 15000,  bills: 8000,   emergencyFund: 10000,  data: 1500,  travel: 30000 },
  UG: { schoolFees: 800000, bills: 300000, emergencyFund: 500000, data: 80000, travel: 1500000 },
  RW: { schoolFees: 100000, bills: 50000,  emergencyFund: 75000,  data: 10000, travel: 200000 },
  BI: { schoolFees: 200000, bills: 80000,  emergencyFund: 120000, data: 15000, travel: 400000 },
};

function GoalStep({ onDone, lang, region }: { onDone: (title: string, amount: number) => void; lang: Language; region: Region }) {
  const [goalId, setGoalId] = useState('');
  const [customName, setCustomName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const cfg = REGION_CONFIG[region];
  const defaults = GOAL_DEFAULTS[region] ?? GOAL_DEFAULTS.TZ;
  const selectedGoal = GOAL_OPTIONS.find(g => g.id === goalId);

  const handlePick = (id: string) => {
    setGoalId(id);
    setError('');
    if (navigator.vibrate) navigator.vibrate(15);
    if (id !== 'custom' && defaults[id]) setAmount(String(defaults[id]));
    else if (id === 'custom') setAmount('');
  };

  const handleSubmit = () => {
    const num = parseInt(amount);
    if (!goalId) { setError(lang === 'sw' ? 'Chagua lengo kwanza' : 'Please pick a goal first'); return; }
    if (!amount || isNaN(num) || num < 100) { setError(lang === 'sw' ? `Ingiza kiasi (angalau ${cfg.symbol} 100)` : `Enter an amount (min ${cfg.symbol} 100)`); return; }
    if (num > 999_999_999) { setError(lang === 'sw' ? 'Kiasi kikubwa sana' : 'Amount too large'); return; }
    const title = goalId === 'custom'
      ? (customName.trim() || (lang === 'sw' ? 'Lengo Langu' : 'My Goal'))
      : (lang === 'sw' ? selectedGoal!.sw : selectedGoal!.en);
    onDone(title, num);
  };

  const fmt = (n: number) => `${cfg.symbol} ${n.toLocaleString()}`;

  return (
    <div className="flex flex-col items-center h-full px-6 pt-8 pb-6">
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Lengo lako la kwanza' : 'Your first goal'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-5">
        {lang === 'sw' ? 'Tuanze safari ya kuokoa!' : "Let's start your savings journey!"}
      </motion.p>

      <div className="w-full max-w-sm grid grid-cols-3 gap-2 mb-4">
        {GOAL_OPTIONS.map(({ id, emoji, en, sw: sw_ }, i) => {
          const isSelected = goalId === id;
          return (
            <motion.button key={id} onClick={() => handlePick(id)}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.05 }} whileTap={{ scale: 0.94 }}
              className={`${cardBase} flex flex-col items-center py-4 px-2 gap-2 ${isSelected ? cardOn : cardIdle}`}
              style={{ minHeight: 82 }}>
              <span className="text-2xl">{emoji}</span>
              <p className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? 'text-white' : 'text-white/40'}`}>
                {lang === 'sw' ? sw_ : en}
              </p>
              <AnimatePresence>
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#16a34a' }}>
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {goalId && (
          <motion.div
            initial={{ opacity: 0, y: 16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="w-full max-w-sm overflow-hidden space-y-2.5">
            {goalId === 'custom' && (
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder={lang === 'sw' ? 'Jina la lengo lako...' : 'Name your goal...'}
                className="w-full bg-white/[0.07] border border-white/[0.12] text-white rounded-2xl px-4 py-3.5 text-sm outline-none placeholder:text-white/25 transition-colors"
                onFocus={e => (e.target.style.borderColor = 'rgba(22,163,74,0.6)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            )}

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                  {lang === 'sw' ? 'Kiasi cha lengo' : 'Target amount'}
                </p>
                {goalId !== 'custom' && defaults[goalId] && (
                  <span className="text-xs" style={{ color: '#4ade80' }}>
                    {lang === 'sw' ? 'Pendekezo:' : 'Suggested:'} {fmt(defaults[goalId])}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/35 text-base font-semibold">{cfg.symbol}</span>
                <input type="number" inputMode="numeric" value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-2xl font-bold outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-xs px-1">
                {error}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-sm mt-4 space-y-2">
        <motion.button onClick={handleSubmit} whileTap={{ scale: 0.97 }} disabled={!goalId}
          className="w-full text-white rounded-2xl py-4 font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          style={{ background: '#16a34a' }}>
          {lang === 'sw' ? 'Anza Kuokoa' : 'Start Saving'}
        </motion.button>
        <button onClick={() => onDone(lang === 'sw' ? 'Lengo Langu' : 'My Goal', 10000)}
          className="w-full text-white/28 text-sm py-2">
          {lang === 'sw' ? 'Ruka kwa sasa' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}

// ── Main OnboardingFlow ────────────────────────────────────────────────────
const TOTAL_STEPS = 6;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { state, setLanguage, setRegion, setUserType, setIncomeFrequency, setFirstGoal, setUserName } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pendingName, setPendingName] = useState(state.userName);

  const go = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleLang = (l: Language) => { setLanguage(l); go(2); };
  const handleName = (n: string) => { setPendingName(n); if (n) setUserName(n); go(3); };
  const handleRegion = (r: Region) => { setRegion(r); go(4); };
  const handleUserType = (ut: UserType) => { setUserType(ut); go(5); };
  const handleIncome = (f: IncomeFrequency) => { setIncomeFrequency(f); go(6); };
  const handleGoal = (title: string, amount: number) => {
    setFirstGoal({ id: '1', title, target: amount, current: 0, completed: false });
    onComplete();
  };

  const lang = state.language;
  const progressStep = Math.max(0, step - 1);
  const showBack = step > 0;
  const showProgress = step >= 1;

  return (
    <div
      className="relative h-screen overflow-hidden flex flex-col select-none"
      style={{ background: '#030b05' }}
    >
      <BackgroundPattern />

      {/* Top bar: back + progress */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-safe-top" style={{ minHeight: 56 }}>
        <div className="w-10 shrink-0">
          {showBack && (
            <motion.button
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => go(step - 1)}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </motion.button>
          )}
        </div>

        {showProgress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
            <ProgressBar total={TOTAL_STEPS} current={progressStep} />
          </motion.div>
        )}

        <div className="w-10 shrink-0" />
      </div>

      {/* Sliding content */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {step === 0 && <WelcomeStep onNext={() => go(1)} lang={lang} />}
            {step === 1 && <LanguageStep onPick={handleLang} />}
            {step === 2 && <NameStep onNext={handleName} lang={lang} initialName={pendingName} />}
            {step === 3 && <RegionStep onPick={handleRegion} lang={lang} />}
            {step === 4 && <UserTypeStep onPick={handleUserType} lang={lang} />}
            {step === 5 && <IncomeStep onPick={handleIncome} lang={lang} />}
            {step === 6 && <GoalStep onDone={handleGoal} lang={lang} region={state.region} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
