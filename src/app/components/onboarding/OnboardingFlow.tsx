import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useApp, type Language, type UserType, type IncomeFrequency } from '@/app/App';
import { REGION_CONFIG, type Region } from '@/app/utils/currency';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ── Floating orb background (shared across all steps) ──────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        animate={{ x: [0, 18, -8, 0], y: [0, -22, 10, 0], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-80px] left-[-60px] w-[340px] h-[340px] bg-emerald-500 rounded-full blur-[90px]"
      />
      <motion.div
        animate={{ x: [0, -20, 12, 0], y: [0, 25, -15, 0], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-60px] right-[-80px] w-[280px] h-[280px] bg-teal-400 rounded-full blur-[80px]"
      />
      <motion.div
        animate={{ x: [0, 14, -6, 0], y: [0, -10, 20, 0], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-cyan-500 rounded-full blur-[70px]"
      />
    </div>
  );
}

// ── Story-style progress dots ───────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 6,
            opacity: i < current ? 0.4 : i === current ? 1 : 0.25,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`h-1.5 rounded-full ${i <= current ? 'bg-emerald-400' : 'bg-white/30'}`}
        />
      ))}
    </div>
  );
}

// ── Slide wrapper ───────────────────────────────────────────────────────
const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// ── Step 0: Cinematic Welcome ───────────────────────────────────────────
function WelcomeStep({ onNext, lang }: { onNext: () => void; lang: Language }) {
  const floaters = ['📲', '💵', '🎯', '🔒', '📊', '💡'];
  return (
    <div className="flex flex-col items-center justify-between h-full px-6 pt-14 pb-12">
      {/* Floating mini icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floaters.map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl select-none"
            style={{ left: `${10 + (i % 3) * 33}%`, top: `${15 + Math.floor(i / 3) * 28}%` }}
            animate={{ y: [-8, 8, -8], rotate: [-6, 6, -6], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          >
            {icon}
          </motion.span>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
          className="relative mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[32px] bg-emerald-400 blur-2xl scale-125"
          />
          <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[32px] flex items-center justify-center shadow-2xl">
            <span style={{ fontSize: '3.5rem' }}>💰</span>
          </div>
        </motion.div>

        {/* Name + tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-5xl font-black text-transparent bg-clip-text mb-3 text-center"
          style={{ backgroundImage: 'linear-gradient(135deg,#ffffff 30%,#6ee7b7 100%)' }}
        >
          PesaPlan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white text-center text-base leading-snug max-w-[260px] mb-10"
        >
          {lang === 'sw'
            ? 'Dhibiti pesa zako, usiogope'
            : 'Control your money, not fear it'}
        </motion.p>

        {/* Feature rows */}
        <div className="w-full max-w-sm space-y-3">
          {[
            { icon: '📲', label: lang === 'sw' ? 'M-Pesa · Airtel · Tigo' : 'M-Pesa · Airtel · Tigo', sub: lang === 'sw' ? 'Pesa za simu zote' : 'All mobile money', color: 'from-emerald-500 to-teal-500' },
            { icon: '📊', label: lang === 'sw' ? 'Bajeti ya AI' : 'AI Budgeting', sub: lang === 'sw' ? 'Akili bandia inakusaidia' : 'Smart spending insights', color: 'from-teal-500 to-cyan-500' },
            { icon: '🔒', label: lang === 'sw' ? 'Faragha Kamili' : '100% Private', sub: lang === 'sw' ? 'Data kwenye simu yako tu' : 'Data stays on your device', color: 'from-cyan-500 to-sky-400' },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 280, damping: 24 }}
              className="flex items-center gap-4 rounded-2xl px-4 py-3.5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '300%' }}
                transition={{ repeat: Infinity, duration: 3.5, delay: 2 + i * 0.6, ease: 'linear' }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent skew-x-[-15deg] pointer-events-none"
              />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-lg shrink-0 shadow-lg`}>
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-white/50 text-xs">{f.sub}</p>
              </div>
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0`}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm mt-8">
        <motion.button
          onClick={onNext}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, type: 'spring', stiffness: 240, damping: 22 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl py-5 font-black text-lg shadow-2xl shadow-emerald-500/30 relative overflow-hidden"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '250%' }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 1.5, ease: 'linear' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]"
          />
          <span className="relative">{lang === 'sw' ? 'Anza Sasa →' : 'Get Started →'}</span>
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.3 }}
          className="text-white text-center text-xs mt-4"
        >
          {lang === 'sw' ? 'Bila malipo · Bila matangazo · Bila mtandao' : 'Free · No ads · Works offline'}
        </motion.p>
      </div>
    </div>
  );
}

// ── Step 1: Language ─────────────────────────────────────────────────────
function LanguageStep({ onPick }: { onPick: (l: Language) => void }) {
  const [picked, setPicked] = useState<Language | null>(null);
  const handle = (l: Language) => {
    setPicked(l);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(l), 350);
  };
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="text-6xl mb-6"
      >
        🌍
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-black text-white text-center mb-1"
      >
        Habari? / Hello!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.2 }}
        className="text-white text-sm text-center mb-8"
      >
        Choose your language · Chagua lugha yako
      </motion.p>

      <div className="w-full max-w-sm space-y-4">
        {([
          { code: 'sw' as Language, name: 'Kiswahili', flag: '🇹🇿', sub: 'Lugha ya kwanza ya Afrika Mashariki', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/40' },
          { code: 'en' as Language, name: 'English', flag: '🇬🇧', sub: 'International language', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/40' },
        ]).map((l, i) => {
          const isSelected = picked === l.code;
          return (
            <motion.button
              key={l.code}
              onClick={() => handle(l.code)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              className={`relative w-full overflow-hidden rounded-3xl text-left transition-all duration-300 ${
                isSelected ? `bg-gradient-to-br ${l.gradient} shadow-2xl ${l.shadow}` : 'bg-white/[0.07] border border-white/10'
              }`}
              style={{ minHeight: 100 }}
            >
              {isSelected && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.3, scale: 1.8 }}
                  className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full blur-2xl pointer-events-none" />
              )}
              <div className="relative flex items-center justify-between px-6 py-5">
                <div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ opacity: 0, y: -8, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-block bg-white/25 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1.5"
                      >
                        ✓ {l.code === 'sw' ? 'Imechaguliwa' : 'Selected'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <p className="text-2xl font-black text-white">{l.name}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-white/40'}`}>{l.sub}</p>
                </div>
                <motion.div
                  animate={isSelected ? { scale: 1.18, rotate: 6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${isSelected ? 'bg-white/20' : 'bg-white/[0.06]'}`}
                >
                  {l.flag}
                </motion.div>
              </div>
              {isSelected && (
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 origin-left" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Name ──────────────────────────────────────────────────────────
function NameStep({ onNext, lang, initialName }: { onNext: (name: string) => void; lang: Language; initialName: string }) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 400); }, []);
  const displayName = name.trim() || (lang === 'sw' ? 'Rafiki' : 'Friend');
  return (
    <div className="flex flex-col items-center h-full px-6 pt-8 pb-6">
      {/* Animated greeting */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: [0, 15, -10, 15, 0] }}
          transition={{ delay: 0.3, duration: 1.2, ease: 'easeInOut' }}
          className="text-6xl mb-5"
        >
          👋
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-black text-white text-center mb-1"
        >
          {lang === 'sw' ? 'Jina lako ni nani?' : "What's your name?"}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.25 }}
          className="text-white text-sm text-center mb-8"
        >
          {lang === 'sw' ? 'Tunataka kukusalimu vizuri' : "We'd love to greet you personally"}
        </motion.p>

        {/* Live preview greeting */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayName}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="mb-8 text-center"
          >
            <p className="text-emerald-300 text-2xl font-black">
              {lang === 'sw' ? `Karibu, ${displayName}! 🌟` : `Hi, ${displayName}! 🌟`}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm"
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onNext(name.trim()); }}
            maxLength={30}
            placeholder={lang === 'sw' ? 'Andika jina lako...' : 'Type your name...'}
            className="w-full text-center text-2xl font-bold bg-white/[0.08] border-2 border-white/20 focus:border-emerald-400 text-white rounded-2xl px-5 py-4 outline-none placeholder:text-white/25 transition-colors"
          />
          <p className="text-center text-white/30 text-xs mt-2">
            {lang === 'sw' ? 'Au bonyeza Endelea bila jina' : 'Or continue without a name'}
          </p>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.button
        onClick={() => onNext(name.trim())}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl py-5 font-black text-lg shadow-2xl shadow-emerald-500/30"
      >
        {lang === 'sw' ? 'Endelea →' : 'Continue →'}
      </motion.button>
    </div>
  );
}

// ── Step 3: Region ─────────────────────────────────────────────────────────
const REGIONS: { code: Region; gradient: string; accent: string }[] = [
  { code: 'TZ', gradient: 'from-emerald-500 to-teal-600',  accent: 'shadow-emerald-400/40' },
  { code: 'KE', gradient: 'from-red-500 to-rose-600',      accent: 'shadow-red-400/40'     },
  { code: 'UG', gradient: 'from-yellow-500 to-amber-600',  accent: 'shadow-amber-400/40'   },
  { code: 'RW', gradient: 'from-blue-500 to-indigo-600',   accent: 'shadow-blue-400/40'    },
  { code: 'BI', gradient: 'from-green-600 to-emerald-700', accent: 'shadow-green-400/40'   },
];

function RegionStep({ onPick, lang }: { onPick: (r: Region) => void; lang: Language }) {
  const [picked, setPicked] = useState<Region | null>(null);
  const handle = (code: Region) => {
    setPicked(code);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(code), 350);
  };
  return (
    <div className="flex flex-col items-center h-full px-6 pt-6 pb-6">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="text-5xl mb-4">
        🗺️
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Uko wapi?' : 'Where are you?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.2 }}
        className="text-white text-sm text-center mb-6">
        {lang === 'sw' ? 'Tutapanga sarafu sahihi kwa nchi yako' : "We'll set the right currency for your country"}
      </motion.p>
      <div className="w-full max-w-sm flex flex-col gap-3">
        {REGIONS.map(({ code, gradient, accent }, i) => {
          const cfg = REGION_CONFIG[code];
          const isSelected = picked === code;
          return (
            <motion.button key={code} onClick={() => handle(code)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              className={`relative w-full overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                isSelected ? `bg-gradient-to-br ${gradient} shadow-xl ${accent}` : 'bg-white/[0.07] border border-white/10'
              }`}
              style={{ minHeight: 72 }}
            >
              {isSelected && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.25, scale: 1.6 }}
                  className="absolute -top-6 -right-6 w-24 h-24 bg-white rounded-full blur-2xl pointer-events-none" />
              )}
              <div className="relative flex items-center gap-4 px-5 py-3.5">
                <motion.span
                  animate={isSelected ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="text-3xl shrink-0"
                >
                  {cfg.flag}
                </motion.span>
                <div className="flex-1">
                  <p className="text-white font-black text-base leading-tight">
                    {lang === 'sw' ? cfg.nameSw : cfg.nameEn}
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-white/35'}`}>
                    {cfg.currency} · {cfg.symbol}
                  </p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="w-6 h-6 bg-white/25 rounded-full flex items-center justify-center shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isSelected && (
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.35 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 origin-left" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: User Type ──────────────────────────────────────────────────────
type UserTypeConfig = { type: UserType; emoji: string; gradient: string; shadow: string; en: string; sw: string; subEn: string; subSw: string };
const USER_TYPES: UserTypeConfig[] = [
  { type: 'student',  emoji: '🎓', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-400/40', en: 'Student / Youth',     sw: 'Mwanafunzi / Kijana',   subEn: 'Stipends & school fees',       subSw: 'Posho na ada za shule' },
  { type: 'biashara', emoji: '🏪', gradient: 'from-orange-500 to-amber-600',  shadow: 'shadow-amber-400/40',  en: 'Biashara Owner',      sw: 'Mmiliki wa Biashara',   subEn: 'Business cash flow',           subSw: 'Mzunguko wa pesa biashara' },
  { type: 'informal', emoji: '🔧', gradient: 'from-sky-500 to-cyan-600',      shadow: 'shadow-sky-400/40',    en: 'Informal Worker',     sw: 'Mfanyakazi wa Kawaida', subEn: 'Daily wages & gigs',           subSw: 'Mishahara ya kila siku' },
  { type: 'family',   emoji: '🏠', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-400/40',en: 'Family Planner',      sw: 'Mpangaji wa Familia',   subEn: 'Household budget',             subSw: 'Bajeti ya familia' },
  { type: 'other',    emoji: '✨', gradient: 'from-rose-500 to-pink-600',     shadow: 'shadow-pink-400/40',   en: 'Other',               sw: 'Nyingine',              subEn: 'Custom tracking',              subSw: 'Ufuatiliaji maalum' },
];

function UserTypeStep({ onPick, lang }: { onPick: (t: UserType) => void; lang: Language }) {
  const [picked, setPicked] = useState<UserType | null>(null);
  const handle = (type: UserType) => {
    setPicked(type);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(type), 360);
  };
  const selectedCfg = USER_TYPES.find(u => u.type === picked);
  return (
    <div className="flex flex-col items-center h-full px-6 pt-6 pb-6">
      {/* Hero emoji — changes to selected */}
      <AnimatePresence mode="wait">
        <motion.div
          key={picked ?? 'default'}
          initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.6, opacity: 0, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="text-5xl mb-4"
        >
          {selectedCfg?.emoji ?? '🤔'}
        </motion.div>
      </AnimatePresence>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Nani wewe?' : 'Who are you?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-5">
        {lang === 'sw' ? 'Tunaboresha uzoefu wako' : 'We personalise your experience'}
      </motion.p>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        {USER_TYPES.map(({ type, emoji, gradient, shadow, en, sw: sw_, subEn, subSw }, i) => {
          const isLast = i === USER_TYPES.length - 1;
          const isSelected = picked === type;
          return (
            <motion.button
              key={type}
              onClick={() => handle(type)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden rounded-3xl text-left transition-all duration-300 ${isLast ? 'col-span-2' : ''} ${
                isSelected ? `bg-gradient-to-br ${gradient} shadow-2xl ${shadow}` : 'bg-white/[0.07] border border-white/10'
              }`}
              style={{ minHeight: isLast ? 80 : 120 }}
            >
              {isSelected && (
                <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 0.25, scale: 1.6 }}
                  className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full blur-xl pointer-events-none" />
              )}
              <div className={`relative flex ${isLast ? 'flex-row items-center gap-4 px-5 py-4' : 'flex-col justify-between p-4'} h-full`}>
                <motion.div
                  animate={isSelected ? { scale: 1.15, rotate: 6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className={`flex items-center justify-center rounded-2xl ${isLast ? 'w-12 h-12 shrink-0' : 'w-12 h-12 mb-auto'} ${isSelected ? 'bg-white/20' : 'bg-white/[0.08]'}`}
                  style={{ fontSize: '1.5rem' }}
                >
                  {emoji}
                </motion.div>
                <div className={isLast ? 'flex-1' : 'mt-2'}>
                  <p className="text-white font-black text-sm leading-tight">{lang === 'sw' ? sw_ : en}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/65' : 'text-white/30'}`}>{lang === 'sw' ? subSw : subEn}</p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
                      className={`absolute top-2.5 right-2.5 w-5 h-5 bg-white/25 rounded-full flex items-center justify-center`}>
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                        <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.span>
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
type FreqConfig = { freq: IncomeFrequency; emoji: string; gradient: string; shadow: string; en: string; sw: string; subEn: string; subSw: string; barEn: string; barSw: string };
const FREQS: FreqConfig[] = [
  { freq: 'daily',    emoji: '☀️', gradient: 'from-amber-500 to-orange-600',   shadow: 'shadow-orange-400/40',  en: 'Daily income',     sw: 'Mapato ya kila siku',  subEn: 'Market traders · hawkers',   subSw: 'Wachuuzi · mafundi',          barEn: 'Every day',   barSw: 'Kila siku' },
  { freq: 'weekly',   emoji: '📅', gradient: 'from-indigo-500 to-violet-600',  shadow: 'shadow-indigo-400/40',  en: 'Weekly income',    sw: 'Mapato ya kila wiki',  subEn: 'Casual workers · drivers',   subSw: 'Wafanyakazi wa muda',         barEn: 'Every week',  barSw: 'Kila wiki' },
  { freq: 'monthly',  emoji: '💼', gradient: 'from-emerald-500 to-teal-600',   shadow: 'shadow-emerald-400/40', en: 'Monthly salary',   sw: 'Mshahara wa kila mwezi', subEn: 'Employed · salaried',        subSw: 'Wafanyakazi wa kudumu',       barEn: 'Every month', barSw: 'Kila mwezi' },
  { freq: 'irregular',emoji: '🔀', gradient: 'from-rose-500 to-fuchsia-600',   shadow: 'shadow-pink-400/40',    en: 'Irregular (mix)',  sw: 'Mchanganyiko',          subEn: 'Freelancers · farmers',      subSw: 'Wakulima · kazi za muda',     barEn: 'Varies',      barSw: 'Hutofautiana' },
];

function IncomeStep({ onPick, lang }: { onPick: (f: IncomeFrequency) => void; lang: Language }) {
  const [picked, setPicked] = useState<IncomeFrequency | null>(null);
  const handle = (freq: IncomeFrequency) => {
    setPicked(freq);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(freq), 360);
  };
  return (
    <div className="flex flex-col items-center h-full px-6 pt-6 pb-6">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="text-5xl mb-4">
        💰
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Unapata pesa vipi?' : 'How do you earn?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-6">
        {lang === 'sw' ? 'Hii inasaidia kutabiri mwenendo wa pesa' : 'Helps us forecast your cash flow'}
      </motion.p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {FREQS.map(({ freq, emoji, gradient, shadow, en, sw: sw_, subEn, subSw, barEn, barSw }, i) => {
          const isSelected = picked === freq;
          return (
            <motion.button key={freq} onClick={() => handle(freq)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              className={`relative overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                isSelected ? `bg-gradient-to-br ${gradient} shadow-xl ${shadow}` : 'bg-white/[0.07] border border-white/10'
              }`}
              style={{ minHeight: 80 }}
            >
              {isSelected && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.25, scale: 1.6 }}
                  className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full blur-xl pointer-events-none" />
              )}
              <div className="relative flex items-center gap-4 px-4 py-4">
                <motion.div animate={isSelected ? { scale: 1.15, rotate: 6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isSelected ? 'bg-white/20' : 'bg-white/[0.08]'}`}>
                  {emoji}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm leading-tight">{lang === 'sw' ? sw_ : en}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/65' : 'text-white/30'}`}>{lang === 'sw' ? subSw : subEn}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-white/[0.07] text-white/40'}`}>
                  {lang === 'sw' ? barSw : barEn}
                </div>
              </div>
              {isSelected && (
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.35 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 origin-left" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 6: Goal Setup ─────────────────────────────────────────────────────
type GoalOption = { id: string; emoji: string; gradient: string; shadow: string; en: string; sw: string; subEn: string; subSw: string };
const GOAL_OPTIONS: GoalOption[] = [
  { id: 'schoolFees',    emoji: '🎓', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-400/40', en: 'School fees',     sw: 'Ada za shule',    subEn: 'Education fund',   subSw: 'Akiba ya elimu' },
  { id: 'bills',         emoji: '💡', gradient: 'from-amber-500 to-orange-600',  shadow: 'shadow-orange-400/40', en: 'Bills & rent',    sw: 'Bili na kodi',    subEn: 'Utilities & rent', subSw: 'Bili na kodi' },
  { id: 'emergencyFund', emoji: '🛡️', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-400/40',en: 'Emergency fund',  sw: 'Akiba ya dharura',subEn: '3-month buffer',   subSw: 'Akiba ya miezi 3' },
  { id: 'data',          emoji: '📱', gradient: 'from-sky-500 to-cyan-600',      shadow: 'shadow-sky-400/40',    en: 'Data & airtime',  sw: 'Data na muda',    subEn: 'Stay connected',   subSw: 'Endelea kuungana' },
  { id: 'travel',        emoji: '✈️', gradient: 'from-teal-500 to-sky-600',      shadow: 'shadow-teal-400/40',   en: 'Travel savings',  sw: 'Akiba ya safari', subEn: 'Trip fund',        subSw: 'Akiba ya safari' },
  { id: 'custom',        emoji: '⭐', gradient: 'from-rose-500 to-pink-600',     shadow: 'shadow-pink-400/40',   en: 'My own goal',     sw: 'Lengo langu',     subEn: 'Set your own',    subSw: 'Weka lengo lako' },
];
const GOAL_DEFAULTS: Record<string, Record<string, number>> = {
  TZ: { schoolFees: 500000, bills: 200000, emergencyFund: 300000, data: 50000, travel: 1000000 },
  KE: { schoolFees: 15000, bills: 8000, emergencyFund: 10000, data: 1500, travel: 30000 },
  UG: { schoolFees: 800000, bills: 300000, emergencyFund: 500000, data: 80000, travel: 1500000 },
  RW: { schoolFees: 100000, bills: 50000, emergencyFund: 75000, data: 10000, travel: 200000 },
  BI: { schoolFees: 200000, bills: 80000, emergencyFund: 120000, data: 15000, travel: 400000 },
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
    <div className="flex flex-col items-center h-full px-6 pt-6 pb-6">
      {/* Hero */}
      <AnimatePresence mode="wait">
        <motion.div key={goalId || 'default'}
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="text-5xl mb-3">
          {selectedGoal?.emoji ?? '🎯'}
        </motion.div>
      </AnimatePresence>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-white text-center mb-1">
        {lang === 'sw' ? 'Lengo lako la kwanza' : 'Your first goal'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.1 }}
        className="text-white text-sm text-center mb-5">
        {lang === 'sw' ? 'Tuanze safari ya kuokoa!' : "Let's start your savings journey!"}
      </motion.p>

      {/* Goal grid */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2.5 mb-4">
        {GOAL_OPTIONS.map(({ id, emoji, gradient, shadow, en, sw: sw_ }, i) => {
          const isSelected = goalId === id;
          return (
            <motion.button key={id} onClick={() => handlePick(id)}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.93 }}
              className={`relative overflow-hidden rounded-2xl flex flex-col items-center justify-center py-3.5 px-2 gap-1.5 transition-all duration-200 ${
                isSelected ? `bg-gradient-to-br ${gradient} shadow-lg ${shadow}` : 'bg-white/[0.07] border border-white/10'
              }`}
              style={{ minHeight: 80 }}
            >
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0.2 }}
                  className="absolute inset-0 bg-white rounded-2xl pointer-events-none" />
              )}
              <motion.span animate={isSelected ? { scale: 1.15, rotate: 8 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="text-2xl relative z-10">
                {emoji}
              </motion.span>
              <p className={`text-[10px] font-bold text-center leading-tight relative z-10 ${isSelected ? 'text-white' : 'text-white/50'}`}>
                {lang === 'sw' ? sw_ : en}
              </p>
              <AnimatePresence>
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                    <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                      <path d="M1 3L2.5 4.5L6 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Amount + inputs */}
      <AnimatePresence>
        {goalId && (
          <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="w-full max-w-sm overflow-hidden space-y-3">
            {goalId === 'custom' && (
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder={lang === 'sw' ? 'Jina la lengo lako...' : 'Name your goal...'}
                className="w-full bg-white/[0.08] border border-white/15 focus:border-emerald-400 text-white rounded-2xl px-4 py-3.5 text-sm outline-none placeholder:text-white/30 transition-colors"
              />
            )}

            {/* Big amount display */}
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">
                  {lang === 'sw' ? 'Kiasi cha lengo' : 'Target amount'}
                </p>
                {goalId !== 'custom' && defaults[goalId] && (
                  <span className="text-emerald-400 text-xs font-medium">
                    {lang === 'sw' ? 'Pendekezo:' : 'Suggested:'} {fmt(defaults[goalId])}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-lg font-bold">{cfg.symbol}</span>
                <input
                  type="number" inputMode="numeric" value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-2xl font-black outline-none placeholder:text-white/20"
                />
              </div>
              {amount && !isNaN(parseInt(amount)) && parseInt(amount) > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-emerald-400 text-xs mt-1">
                  {cfg.currency} {parseInt(amount).toLocaleString()}
                </motion.p>
              )}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-xs px-1">⚠️ {error}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip / CTA */}
      <div className="w-full max-w-sm mt-4 space-y-2">
        <motion.button
          onClick={handleSubmit}
          whileTap={{ scale: 0.97 }}
          disabled={!goalId}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl py-5 font-black text-lg shadow-2xl shadow-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          {lang === 'sw' ? 'Anza Kuokoa 🚀' : 'Start Saving 🚀'}
        </motion.button>
        <button onClick={() => onDone(lang === 'sw' ? 'Lengo Langu' : 'My Goal', 10000)}
          className="w-full text-white/35 text-sm py-2">
          {lang === 'sw' ? 'Ruka kwa sasa →' : 'Skip for now →'}
        </button>
      </div>
    </div>
  );
}

// ── Main OnboardingFlow ────────────────────────────────────────────────────
const TOTAL_STEPS = 6; // 0=welcome, 1=lang, 2=name, 3=region, 4=userType, 5=income, 6=goal  (progress shows 0–5 for steps 1–6)

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
  const progressStep = Math.max(0, step - 1); // 0-indexed for dots (steps 1–6 → dots 0–5)
  const showBack = step > 0;
  const showProgress = step >= 1;

  return (
    <div className="relative h-screen bg-[#040d09] overflow-hidden flex flex-col select-none">
      <FloatingOrbs />

      {/* Top bar: back + progress */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe-top" style={{ minHeight: 56 }}>
        <div className="w-10">
          {showBack && step > 0 && (
            <motion.button
              key="back"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => go(step - 1)}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </div>

        {showProgress && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <ProgressDots total={TOTAL_STEPS} current={progressStep} />
          </motion.div>
        )}

        <div className="w-10" />
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
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
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
