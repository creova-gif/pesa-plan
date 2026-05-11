import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { useApp, type Language, type UserType, type IncomeFrequency } from '@/app/App';
import { REGION_CONFIG, LANGUAGE_REGIONS, getRegionName, type Region } from '@/app/utils/currency';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 items-center flex-1">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="h-[3px] rounded-full flex-1"
          animate={{ backgroundColor: i <= current ? '#FD8240' : '#F4F4F2' }}
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

// ── Card style helpers ─────────────────────────────────────────────────────
const cardBase = 'relative overflow-hidden rounded-2xl text-left transition-all duration-200 cursor-pointer';
const cardIdle = 'bg-white border border-[#F4F4F2]';
const cardOn   = 'bg-white border-2 border-[#FD8240]';

// ── Confetti burst (animejs) ───────────────────────────────────────────────
function spawnConfetti(container: HTMLElement) {
  const colors = ['#FD8240', '#4E886F', '#5CC7A0', '#FFD166', '#EF476F', '#fff'];
  const count = 60;
  const particles: HTMLElement[] = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = 6 + Math.random() * 8;
    el.style.cssText = `
      position:absolute; width:${size}px; height:${size}px;
      background:${colors[i % colors.length]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      left:50%; top:50%; pointer-events:none; opacity:1; z-index:999;
    `;
    container.appendChild(el);
    particles.push(el);
  }

  animate(particles, {
    translateX: () => (Math.random() - 0.5) * 380,
    translateY: () => -80 - Math.random() * 280,
    scale: [1, 0.1],
    opacity: [1, 0],
    rotate: () => (Math.random() - 0.5) * 720,
    duration: 900 + Math.random() * 500,
    easing: 'easeOutExpo',
    delay: stagger(12),
    onComplete: () => particles.forEach(p => p.remove()),
  });
}

// ── Animated chart SVG for hero ────────────────────────────────────────────
function HeroChart() {
  const pathRef = useRef<SVGPathElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${length}`;
      pathRef.current.style.strokeDashoffset = `${length}`;
      animate(pathRef.current, {
        strokeDashoffset: [length, 0],
        duration: 1400,
        easing: 'easeInOutCubic',
        delay: 400,
      });
    }
    if (counterRef.current) {
      const target = { val: 0 };
      animate(target, {
        val: 1247500,
        duration: 1600,
        delay: 500,
        easing: 'easeOutExpo',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = Math.round(target.val).toLocaleString();
          }
        },
      });
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 160 }}>
      {/* Balance counter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginBottom: 8 }}
      >
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Geist, sans-serif', marginBottom: 2 }}>
          Total Balance
        </p>
        <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: 'Geist, sans-serif', letterSpacing: '-0.02em' }}>
          TZS <span ref={counterRef}>0</span>
        </p>
      </motion.div>

      {/* Chart line */}
      <svg viewBox="0 0 300 80" width="100%" height="80" style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[20, 40, 60].map(y => (
          <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}
        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5CC7A0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5CC7A0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,70 C30,65 50,60 80,50 C110,40 120,55 150,38 C180,22 200,35 230,20 C260,8 280,12 300,5 L300,80 L0,80 Z"
          fill="url(#chartFill)"
        />
        {/* Chart line itself */}
        <path
          ref={pathRef}
          d="M0,70 C30,65 50,60 80,50 C110,40 120,55 150,38 C180,22 200,35 230,20 C260,8 280,12 300,5"
          fill="none"
          stroke="#5CC7A0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* End dot */}
        <motion.circle
          cx="300" cy="5" r="5" fill="#5CC7A0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8, type: 'spring', stiffness: 400 }}
        />
        <motion.circle
          cx="300" cy="5" r="9" fill="none" stroke="#5CC7A0" strokeWidth="1.5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 0.5, 0] }}
          transition={{ delay: 1.9, duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
        />
      </svg>
    </div>
  );
}

// ── Floating particle for hero bg ──────────────────────────────────────────
function FloatingParticle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <motion.div
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(92,199,160,0.25)',
        pointerEvents: 'none',
      }}
      animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 3 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

// ── Step 0: Welcome (cinematic) ────────────────────────────────────────────
function WelcomeStep({ onNext, lang }: { onNext: () => void; lang: Language }) {
  const confettiRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback(() => {
    if (confettiRef.current) spawnConfetti(confettiRef.current);
    setTimeout(onNext, 280);
  }, [onNext]);

  const taglines: Record<string, string> = {
    en: 'Control your money, without fear',
    sw: 'Dhibiti pesa zako, usiogope',
    fr: 'Contrôlez votre argent, sans crainte',
    ar: 'تحكم في أموالك، بلا خوف',
    pt: 'Controle seu dinheiro, sem medo',
  };

  const cta: Record<string, string> = {
    en: 'Get Started',
    sw: 'Anza Sasa',
    fr: 'Commencer',
    ar: 'ابدأ الآن',
    pt: 'Começar',
  };

  const footer: Record<string, string> = {
    en: 'Free · No ads · Works offline',
    sw: 'Bila malipo · Bila matangazo · Bila mtandao',
    fr: 'Gratuit · Sans pub · Hors ligne',
    ar: 'مجاني · بدون إعلانات · يعمل دون إنترنت',
    pt: 'Grátis · Sem anúncios · Funciona offline',
  };

  const pills = [
    { icon: '📲', en: 'M-Pesa · Airtel', sw: 'M-Pesa · Airtel', fr: 'M-Pesa · Airtel', ar: 'M-Pesa · Airtel', pt: 'M-Pesa · Airtel' },
    { icon: '✨', en: 'AI Coach', sw: 'AI Coach', fr: 'Coach IA', ar: 'مدرب AI', pt: 'Coach IA' },
    { icon: '🔒', en: '100% Private', sw: 'Faragha', fr: 'Privé', ar: 'خاص ١٠٠٪', pt: 'Privado' },
  ];

  return (
    <div ref={confettiRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* ── Hero (top 55%) — dark green ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #0F2419 0%, #1A3D2E 40%, #245E42 100%)',
        padding: '48px 28px 32px',
        flexShrink: 0,
        overflow: 'hidden',
        minHeight: '55vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        {/* Floating particles */}
        {[
          { x: 8, y: 15, d: 0, s: 6 }, { x: 85, y: 10, d: 0.5, s: 10 },
          { x: 60, y: 30, d: 1.2, s: 5 }, { x: 20, y: 60, d: 0.8, s: 8 },
          { x: 75, y: 55, d: 1.8, s: 4 }, { x: 45, y: 8, d: 2.1, s: 7 },
        ].map((p, i) => <FloatingParticle key={i} x={p.x} y={p.y} delay={p.d} size={p.s} />)}

        {/* Radial glow top-right */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(92,199,160,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* App name top */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ position: 'absolute', top: 20, left: 28, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #4E886F, #245E42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(78,136,111,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
              <path d="M13 2 L14.6 10.4 L23 12 L14.6 13.6 L13 22 L11.4 13.6 L3 12 L11.4 10.4 Z" fill="white" fillOpacity="0.95" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', fontFamily: 'Geist, sans-serif', letterSpacing: '-0.01em' }}>Maokoto</span>
        </motion.div>

        {/* Chart + Counter */}
        <HeroChart />
      </div>

      {/* ── Bottom white panel ── */}
      <div style={{
        flex: 1,
        background: '#fff',
        padding: '28px 28px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '28px 28px 0 0',
        marginTop: -20,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
      }}>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 28 }}
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#1A1F1C',
              fontFamily: 'Geist, sans-serif',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 10,
            }}
          >
            {taglines[lang] || taglines.en}
          </motion.h1>

          {/* Pill badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {pills.map((p, i) => (
              <motion.span
                key={p.en}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.08, type: 'spring', stiffness: 400 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: '#EAF6F1', border: '1px solid rgba(78,136,111,0.2)',
                  borderRadius: 999, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, color: '#2D6A4F',
                  fontFamily: 'Geist, sans-serif',
                }}
              >
                <span>{p.icon}</span>
                <span>{p[lang as keyof typeof p] || p.en}</span>
              </motion.span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <motion.button
            onClick={handleStart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #FD8240 0%, #F55D3E 100%)',
              color: '#fff',
              borderRadius: 999,
              padding: '17px 0',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
              boxShadow: '0 8px 28px rgba(253,130,64,0.42)',
              letterSpacing: '-0.01em',
            }}
          >
            {cta[lang] || cta.en}
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ color: '#B0ADA9', textAlign: 'center', fontSize: 12, marginTop: 12, fontFamily: 'Geist, sans-serif' }}
          >
            {footer[lang] || footer.en}
          </motion.p>
        </div>
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

  const options: { code: Language; name: string; flag: string; sub: string }[] = [
    { code: 'sw', name: 'Kiswahili', flag: '🇹🇿', sub: 'Lugha ya kwanza ya Afrika Mashariki' },
    { code: 'en', name: 'English',   flag: '🇬🇧', sub: 'International language' },
    { code: 'fr', name: 'Français',  flag: '🇫🇷', sub: 'Pour les pays francophones d\'Afrique' },
    { code: 'ar', name: 'العربية',   flag: '🇪🇬', sub: 'للدول الناطقة بالعربية في أفريقيا' },
    { code: 'pt', name: 'Português', flag: '🇦🇴', sub: 'Para os países lusófonos de África' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px' }}>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ color: '#928F8B', fontSize: 14, textAlign: 'center', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
        Choose your language · Choisissez votre langue
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ fontSize: 26, fontWeight: 700, color: '#4D4845', textAlign: 'center', marginBottom: 24, fontFamily: 'Geist, sans-serif' }}>
        Habari? / Hello! / مرحبا
      </motion.h2>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((l, i) => {
          const isSelected = picked === l.code;
          const isRtl = l.code === 'ar';
          return (
            <motion.button
              key={l.code}
              onClick={() => handle(l.code)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              whileTap={{ scale: 0.98 }}
              className={`${cardBase} ${isSelected ? cardOn : cardIdle}`}
              style={{ width: '100%', minHeight: 72 }}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{l.flag}</span>
                <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#4D4845', fontFamily: isRtl ? 'system-ui, sans-serif' : 'Geist, sans-serif' }}>{l.name}</p>
                  <p style={{ fontSize: 11, color: '#928F8B', marginTop: 2, fontFamily: 'Geist, sans-serif' }}>{l.sub}</p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: '#FD8240', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check style={{ width: 12, height: 12, color: '#fff' }} strokeWidth={2.5} />
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '40px 24px 24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 340 }}>
        <motion.div
          animate={{ rotate: [0, 15, -10, 15, 0] }}
          transition={{ delay: 0.2, duration: 1.2 }}
          style={{ fontSize: 48, marginBottom: 24 }}
        >
          👋
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 28, fontWeight: 700, color: '#4D4845', textAlign: 'center', marginBottom: 6, fontFamily: 'Geist, sans-serif' }}>
          {lang === 'sw' ? 'Jina lako ni nani?' : "What's your name?"}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ color: '#928F8B', fontSize: 14, textAlign: 'center', marginBottom: 28, fontFamily: 'Geist, sans-serif' }}>
          {lang === 'sw' ? 'Tunataka kukusalimu vizuri' : "We'd love to greet you personally"}
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.p key={displayName}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ fontSize: 20, fontWeight: 600, color: '#4E886F', marginBottom: 24, textAlign: 'center', fontFamily: 'Geist, sans-serif' }}>
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
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 600,
            background: '#F6F6F4',
            border: '1.5px solid #F4F4F2',
            color: '#4D4845',
            borderRadius: 16,
            padding: '14px 20px',
            outline: 'none',
            fontFamily: 'Geist, sans-serif',
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = '#FD8240')}
          onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
        />
        <p style={{ color: '#928F8B', fontSize: 12, marginTop: 8, textAlign: 'center', fontFamily: 'Geist, sans-serif' }}>
          {lang === 'sw' ? 'Au bonyeza Endelea bila jina' : 'Or continue without a name'}
        </p>
      </div>

      <motion.button
        onClick={() => onNext(name.trim())}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%',
          maxWidth: 340,
          background: '#FD8240',
          color: '#fff',
          borderRadius: 999,
          padding: '16px 0',
          fontWeight: 600,
          fontSize: 16,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Geist, sans-serif',
        }}>
        {lang === 'sw' ? 'Endelea' : 'Continue'}
      </motion.button>
    </div>
  );
}

// ── Step 3: Region ─────────────────────────────────────────────────────────
const REGION_STEP_COPY: Record<Language, { title: string; subtitle: string }> = {
  sw: { title: 'Uko wapi?',         subtitle: 'Tutapanga sarafu sahihi kwa nchi yako' },
  en: { title: 'Where are you?',    subtitle: "We'll set the right currency for your country" },
  fr: { title: 'Où êtes-vous ?',    subtitle: 'Nous configurerons la bonne devise pour votre pays' },
  ar: { title: 'أين تقيم؟',         subtitle: 'سنضبط العملة الصحيحة لبلدك' },
  pt: { title: 'Onde você está?',   subtitle: 'Definiremos a moeda certa para o seu país' },
};

function RegionStep({ onPick, lang }: { onPick: (r: Region) => void; lang: Language }) {
  const [picked, setPicked] = useState<Region | null>(null);
  const handle = (code: Region) => {
    setPicked(code);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => onPick(code), 320);
  };

  const regions = LANGUAGE_REGIONS[lang] ?? LANGUAGE_REGIONS.en;
  const copy = REGION_STEP_COPY[lang];
  const isRtl = lang === 'ar';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 24px 0' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, fontWeight: 700, color: '#4D4845', textAlign: 'center', marginBottom: 6, fontFamily: isRtl ? 'system-ui, sans-serif' : 'Geist, sans-serif' }}>
        {copy.title}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ color: '#928F8B', fontSize: 14, textAlign: 'center', marginBottom: 16, fontFamily: 'Geist, sans-serif' }}>
        {copy.subtitle}
      </motion.p>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 24 }}>
      <div style={{ maxWidth: 340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {regions.map((code, i) => {
          const cfg = REGION_CONFIG[code];
          const isSelected = picked === code;
          return (
            <motion.button key={code} onClick={() => handle(code)}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04 }} whileTap={{ scale: 0.98 }}
              className={`${cardBase} ${isSelected ? cardOn : cardIdle}`}
              style={{ width: '100%', minHeight: 64, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px' }}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>{cfg.flag}</span>
                <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: '#4D4845', fontFamily: isRtl ? 'system-ui, sans-serif' : 'Geist, sans-serif' }}>
                    {getRegionName(code, lang)}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{cfg.currency} · {cfg.symbol}</p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ width: 20, height: 20, borderRadius: '50%', background: '#FD8240', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check style={{ width: 11, height: 11, color: '#fff' }} strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '32px 24px 24px' }}>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, fontWeight: 700, color: '#4D4845', textAlign: 'center', marginBottom: 6, fontFamily: 'Geist, sans-serif' }}>
        {lang === 'sw' ? 'Nani wewe?' : 'Who are you?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ color: '#928F8B', fontSize: 14, textAlign: 'center', marginBottom: 24, fontFamily: 'Geist, sans-serif' }}>
        {lang === 'sw' ? 'Tunaboresha uzoefu wako' : 'We personalise your experience'}
      </motion.p>

      <div style={{ width: '100%', maxWidth: 340, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {USER_TYPES.map(({ type, emoji, en, sw: sw_, subEn, subSw }, i) => {
          const isLast = i === USER_TYPES.length - 1;
          const isSelected = picked === type;
          return (
            <motion.button key={type} onClick={() => handle(type)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }} whileTap={{ scale: 0.96 }}
              className={`${cardBase} ${isLast ? 'col-span-2' : ''} ${isSelected ? cardOn : cardIdle}`}
              style={{ minHeight: isLast ? 64 : 100 }}>
              <div style={{
                display: 'flex',
                flexDirection: isLast ? 'row' : 'column',
                alignItems: isLast ? 'center' : 'flex-start',
                gap: isLast ? 12 : 8,
                padding: 16,
                height: '100%',
                position: 'relative',
              }}>
                <span style={{ fontSize: isLast ? 22 : 24 }}>{emoji}</span>
                <div style={{ flex: isLast ? 1 : undefined, marginTop: isLast ? 0 : 'auto' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? sw_ : en}
                  </p>
                  <p style={{ fontSize: 11, color: '#928F8B', marginTop: 2, fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? subSw : subEn}
                  </p>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#FD8240', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: 10, height: 10, color: '#fff' }} strokeWidth={2.5} />
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '32px 24px 24px' }}>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, fontWeight: 700, color: '#4D4845', textAlign: 'center', marginBottom: 6, fontFamily: 'Geist, sans-serif' }}>
        {lang === 'sw' ? 'Unapata pesa vipi?' : 'How do you earn?'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ color: '#928F8B', fontSize: 14, textAlign: 'center', marginBottom: 24, fontFamily: 'Geist, sans-serif' }}>
        {lang === 'sw' ? 'Hii inasaidia kutabiri mwenendo wa pesa' : 'Helps us forecast your cash flow'}
      </motion.p>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FREQS.map(({ freq, emoji, en, sw: sw_, subEn, subSw, tagEn, tagSw }, i) => {
          const isSelected = picked === freq;
          return (
            <motion.button key={freq} onClick={() => handle(freq)}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }} whileTap={{ scale: 0.98 }}
              className={`${cardBase} ${isSelected ? cardOn : cardIdle}`}
              style={{ width: '100%', minHeight: 72 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? sw_ : en}
                  </p>
                  <p style={{ fontSize: 12, color: '#928F8B', marginTop: 2, fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? subSw : subEn}
                  </p>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 500,
                  flexShrink: 0,
                  background: isSelected ? 'rgba(253,130,64,0.12)' : '#F6F6F4',
                  color: isSelected ? '#FD8240' : '#928F8B',
                  fontFamily: 'Geist, sans-serif',
                }}>
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

// ── Multilingual helper ────────────────────────────────────────────────────
type L5<T extends string = string> = Record<Language, T>;
function ml(lang: Language, map: Partial<L5> & { en: string }): string {
  return map[lang] ?? map.en;
}

// ── Step 6: Goal Setup ─────────────────────────────────────────────────────
type GoalOption = { id: string; emoji: string } & Partial<L5>;
const GOAL_OPTIONS: (GoalOption & { en: string })[] = [
  { id: 'schoolFees',    emoji: '🎓', en: 'School fees',    sw: 'Ada za shule',        fr: 'Frais scolaires',   ar: 'رسوم مدرسية',      pt: 'Propinas escolares' },
  { id: 'bills',         emoji: '💡', en: 'Bills & rent',   sw: 'Bili na kodi',         fr: 'Factures & loyer',  ar: 'فواتير وإيجار',    pt: 'Contas & aluguel' },
  { id: 'emergencyFund', emoji: '🛡️', en: 'Emergency fund', sw: 'Akiba ya dharura',    fr: 'Fonds d\'urgence',  ar: 'صندوق طوارئ',      pt: 'Fundo de emergência' },
  { id: 'data',          emoji: '📱', en: 'Data & airtime', sw: 'Data na muda',         fr: 'Data & forfait',    ar: 'بيانات وإنترنت',   pt: 'Dados & crédito' },
  { id: 'travel',        emoji: '✈️', en: 'Travel savings', sw: 'Akiba ya safari',      fr: 'Épargne voyage',    ar: 'ادخار السفر',       pt: 'Poupança viagem' },
  { id: 'custom',        emoji: '⭐', en: 'My own goal',    sw: 'Lengo langu',          fr: 'Mon propre objectif', ar: 'هدفي الخاص',     pt: 'Meu próprio objetivo' },
];
const GOAL_DEFAULTS: Record<string, Record<string, number>> = {
  // East Africa
  TZ: { schoolFees: 500000,   bills: 200000,  emergencyFund: 300000,  data: 50000,  travel: 1000000 },
  KE: { schoolFees: 15000,    bills: 8000,    emergencyFund: 10000,   data: 1500,   travel: 30000 },
  UG: { schoolFees: 800000,   bills: 300000,  emergencyFund: 500000,  data: 80000,  travel: 1500000 },
  RW: { schoolFees: 100000,   bills: 50000,   emergencyFund: 75000,   data: 10000,  travel: 200000 },
  BI: { schoolFees: 200000,   bills: 80000,   emergencyFund: 120000,  data: 15000,  travel: 400000 },
  CD: { schoolFees: 500000,   bills: 200000,  emergencyFund: 300000,  data: 50000,  travel: 1000000 },
  // Francophone West & Central Africa
  SN: { schoolFees: 200000,   bills: 80000,   emergencyFund: 120000,  data: 15000,  travel: 400000 },
  CI: { schoolFees: 200000,   bills: 80000,   emergencyFund: 120000,  data: 15000,  travel: 400000 },
  CM: { schoolFees: 200000,   bills: 80000,   emergencyFund: 120000,  data: 15000,  travel: 400000 },
  ML: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  BF: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  GN: { schoolFees: 2000000,  bills: 800000,  emergencyFund: 1200000, data: 150000, travel: 4000000 },
  GA: { schoolFees: 300000,   bills: 120000,  emergencyFund: 180000,  data: 20000,  travel: 600000 },
  TG: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  BJ: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  CG: { schoolFees: 200000,   bills: 80000,   emergencyFund: 120000,  data: 15000,  travel: 400000 },
  CF: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  NE: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  TD: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  MG: { schoolFees: 1000000,  bills: 400000,  emergencyFund: 600000,  data: 80000,  travel: 2000000 },
  // North Africa (Arabic)
  EG: { schoolFees: 5000,     bills: 2000,    emergencyFund: 3000,    data: 500,    travel: 10000 },
  MA: { schoolFees: 3000,     bills: 1200,    emergencyFund: 1800,    data: 200,    travel: 6000 },
  DZ: { schoolFees: 30000,    bills: 12000,   emergencyFund: 18000,   data: 2000,   travel: 60000 },
  TN: { schoolFees: 1500,     bills: 600,     emergencyFund: 900,     data: 100,    travel: 3000 },
  LY: { schoolFees: 1000,     bills: 400,     emergencyFund: 600,     data: 80,     travel: 2000 },
  SD: { schoolFees: 500000,   bills: 200000,  emergencyFund: 300000,  data: 40000,  travel: 1000000 },
  MR: { schoolFees: 100000,   bills: 40000,   emergencyFund: 60000,   data: 8000,   travel: 200000 },
  // English-speaking
  NG: { schoolFees: 500000,   bills: 200000,  emergencyFund: 300000,  data: 30000,  travel: 1000000 },
  GH: { schoolFees: 3000,     bills: 1200,    emergencyFund: 1800,    data: 200,    travel: 6000 },
  ZA: { schoolFees: 10000,    bills: 4000,    emergencyFund: 6000,    data: 600,    travel: 20000 },
  ZM: { schoolFees: 10000,    bills: 4000,    emergencyFund: 6000,    data: 800,    travel: 20000 },
  ZW: { schoolFees: 5000,     bills: 2000,    emergencyFund: 3000,    data: 400,    travel: 10000 },
  MW: { schoolFees: 300000,   bills: 120000,  emergencyFund: 180000,  data: 20000,  travel: 600000 },
  BW: { schoolFees: 5000,     bills: 2000,    emergencyFund: 3000,    data: 300,    travel: 10000 },
  NA: { schoolFees: 6000,     bills: 2400,    emergencyFund: 3600,    data: 400,    travel: 12000 },
  // Lusophone Africa
  AO: { schoolFees: 500000,   bills: 200000,  emergencyFund: 300000,  data: 40000,  travel: 1000000 },
  MZ: { schoolFees: 100000,   bills: 40000,   emergencyFund: 60000,   data: 8000,   travel: 200000 },
  CV: { schoolFees: 30000,    bills: 12000,   emergencyFund: 18000,   data: 2000,   travel: 60000 },
  GW: { schoolFees: 150000,   bills: 60000,   emergencyFund: 90000,   data: 12000,  travel: 300000 },
  ST: { schoolFees: 100000,   bills: 40000,   emergencyFund: 60000,   data: 8000,   travel: 200000 },
};

function GoalStep({ onDone, lang, region }: { onDone: (title: string, amount: number) => void; lang: Language; region: Region }) {
  const [goalId, setGoalId] = useState('');
  const [customName, setCustomName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);
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
    if (!goalId) { setError(ml(lang, { en: 'Please pick a goal first', sw: 'Chagua lengo kwanza', fr: 'Choisissez un objectif', ar: 'اختر هدفاً أولاً', pt: 'Escolha um objetivo' })); return; }
    if (!amount || isNaN(num) || num < 100) { setError(ml(lang, { en: `Enter an amount (min ${cfg.symbol} 100)`, sw: `Ingiza kiasi (angalau ${cfg.symbol} 100)`, fr: `Entrez un montant (min ${cfg.symbol} 100)`, ar: `أدخل مبلغاً (الحد الأدنى ${cfg.symbol} 100)`, pt: `Insira um valor (mín ${cfg.symbol} 100)` })); return; }
    if (num > 999_999_999) { setError(ml(lang, { en: 'Amount too large', sw: 'Kiasi kikubwa sana', fr: 'Montant trop élevé', ar: 'المبلغ كبير جداً', pt: 'Valor muito alto' })); return; }
    const title = goalId === 'custom'
      ? (customName.trim() || ml(lang, { en: 'My Goal', sw: 'Lengo Langu', fr: 'Mon Objectif', ar: 'هدفي', pt: 'Meu Objetivo' }))
      : ml(lang, selectedGoal as Partial<L5> & { en: string });
    onDone(title, num);
  };

  const fmt = (n: number) => `${cfg.symbol} ${n.toLocaleString()}`;
  const isReady = !!(goalId && amount && !isNaN(parseInt(amount)) && parseInt(amount) >= 100);

  const isRtl = lang === 'ar';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '32px 24px 24px' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, fontWeight: 700, color: '#4D4845', textAlign: 'center', marginBottom: 6, fontFamily: isRtl ? 'system-ui, sans-serif' : 'Geist, sans-serif' }}>
        {ml(lang, { en: 'Your first goal', sw: 'Lengo lako la kwanza', fr: 'Votre premier objectif', ar: 'هدفك الأول', pt: 'Seu primeiro objetivo' })}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ color: '#928F8B', fontSize: 14, textAlign: 'center', marginBottom: 20, fontFamily: 'Geist, sans-serif' }}>
        {ml(lang, { en: "Let's start your savings journey!", sw: 'Tuanze safari ya kuokoa!', fr: 'Commençons votre parcours d\'épargne !', ar: 'لنبدأ رحلة الادخار!', pt: 'Vamos começar sua jornada de poupança!' })}
      </motion.p>

      <div style={{ width: '100%', maxWidth: 340, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {GOAL_OPTIONS.map((opt, i) => {
          const { id, emoji } = opt;
          const isSelected = goalId === id;
          return (
            <motion.button key={id} onClick={() => handlePick(id)}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.05 }} whileTap={{ scale: 0.94 }}
              className={`${cardBase} ${isSelected ? cardOn : cardIdle}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', gap: 6, minHeight: 80, position: 'relative' }}>
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <p style={{ fontSize: 10, fontWeight: 500, color: isSelected ? '#FD8240' : '#928F8B', textAlign: 'center', fontFamily: 'Geist, sans-serif', lineHeight: 1.3 }}>
                {ml(lang, opt)}
              </p>
              <AnimatePresence>
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: '50%', background: '#FD8240', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check style={{ width: 8, height: 8, color: '#fff' }} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div style={{ width: '100%', maxWidth: 340 }}>
        <AnimatePresence>
          {goalId && (
            <motion.div
              initial={{ opacity: 0, y: 16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {goalId === 'custom' && (
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder={ml(lang, { en: 'Name your goal...', sw: 'Jina la lengo lako...', fr: 'Nommez votre objectif...', ar: 'سمِّ هدفك...', pt: 'Nomeie seu objetivo...' })}
                  style={{
                    width: '100%',
                    background: '#F6F6F4',
                    border: '1.5px solid #F4F4F2',
                    color: '#4D4845',
                    borderRadius: 14,
                    padding: '12px 16px',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'Geist, sans-serif',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#FD8240')}
                  onBlur={e => (e.target.style.borderColor = '#F4F4F2')}
                />
              )}

              <div style={{ borderRadius: 14, padding: 16, background: '#F6F6F4', border: `1.5px solid ${amountFocused ? '#FD8240' : '#F4F4F2'}`, transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#928F8B', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Geist, sans-serif' }}>
                    {ml(lang, { en: 'Target amount', sw: 'Kiasi cha lengo', fr: 'Montant cible', ar: 'المبلغ المستهدف', pt: 'Valor alvo' })}
                  </p>
                  {goalId !== 'custom' && defaults[goalId] && (
                    <span style={{ fontSize: 11, color: '#4E886F', fontFamily: 'Geist, sans-serif' }}>
                      {ml(lang, { en: 'Suggested:', sw: 'Pendekezo:', fr: 'Suggéré :', ar: 'مقترح:', pt: 'Sugerido:' })} {fmt(defaults[goalId])}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#928F8B', fontSize: 16, fontWeight: 600, fontFamily: 'Geist, sans-serif' }}>{cfg.symbol}</span>
                  <input type="number" inputMode="numeric" value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                    placeholder="0"
                    style={{ flex: 1, background: 'transparent', color: '#4D4845', fontSize: 24, fontWeight: 700, outline: 'none', border: 'none', fontFamily: 'Geist, sans-serif' }}
                  />
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  style={{ color: '#C9362B', fontSize: 12, paddingLeft: 4, fontFamily: 'Geist, sans-serif' }}>
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <motion.button onClick={handleSubmit} whileTap={{ scale: 0.97 }} disabled={!isReady}
            style={{
              width: '100%',
              background: isReady ? '#FD8240' : '#F4F4F2',
              color: isReady ? '#fff' : '#928F8B',
              borderRadius: 999,
              padding: '16px 0',
              fontWeight: 600,
              fontSize: 16,
              border: 'none',
              cursor: isReady ? 'pointer' : 'not-allowed',
              fontFamily: 'Geist, sans-serif',
              transition: 'all 0.2s',
            }}>
            {ml(lang, { en: 'Start Saving', sw: 'Anza Kuokoa', fr: 'Commencer à épargner', ar: 'ابدأ الادخار', pt: 'Começar a poupar' })}
          </motion.button>
          <button onClick={() => onDone(ml(lang, { en: 'My Goal', sw: 'Lengo Langu', fr: 'Mon Objectif', ar: 'هدفي', pt: 'Meu Objetivo' }), defaults['emergencyFund'] ?? 50000)}
            style={{ background: 'none', border: 'none', color: '#928F8B', fontSize: 14, padding: '8px 0', cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}>
            {ml(lang, { en: 'Skip for now', sw: 'Ruka kwa sasa', fr: 'Passer pour l\'instant', ar: 'تخطى الآن', pt: 'Pular por agora' })}
          </button>
        </div>
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
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        userSelect: 'none',
      }}
    >
      {/* Top bar: back + progress */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', minHeight: 56 }}>
        <div style={{ width: 40, flexShrink: 0 }}>
          {showBack && (
            <motion.button
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => go(step - 1)}
              style={{
                padding: 8,
                background: '#F6F6F4',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft style={{ width: 18, height: 18, color: '#4D4845' }} />
            </motion.button>
          )}
        </div>

        {showProgress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
            <ProgressBar total={TOTAL_STEPS} current={progressStep} />
          </motion.div>
        )}

        <div style={{ width: 40, flexShrink: 0 }} />
      </div>

      {/* Sliding content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, overflow: 'hidden' }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
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
