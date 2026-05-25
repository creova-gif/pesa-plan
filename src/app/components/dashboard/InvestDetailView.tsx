import { useState } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Check, Sprout, Search, MoreHorizontal, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/app/App';
import { formatCurrency } from '@/app/utils/currency';

type View = 'purpose' | 'riskLevel' | 'portfolioDetail' | 'stocksList' | 'stockDetail';

interface Props {
  initialView: View;
  portfolioName?: string;
  stockName?: string;
  onBack: () => void;
}

const PURPOSES = [
  { id: 'growth', en: 'Financial Growth', sw: 'Ukuaji wa Kifedha', fr: 'Croissance financière', ar: 'النمو المالي', pt: 'Crescimento financeiro', desc_en: 'A portfolio for financial growth over a long period of time', desc_sw: 'Portfolio ya ukuaji wa fedha kwa muda mrefu', icon: '📈' },
  { id: 'retirement', en: 'Retirement', sw: 'Uzeeni', fr: 'Retraite', ar: 'التقاعد', pt: 'Aposentadoria', desc_en: 'Save for a comfortable retirement and future security', desc_sw: 'Weka akiba kwa uzeeni na usalama wa baadaye', icon: '🏖️' },
  { id: 'education', en: 'Education', sw: 'Elimu', fr: 'Éducation', ar: 'التعليم', pt: 'Educação', desc_en: 'Fund your education or your children\'s future studies', desc_sw: 'Saidia elimu yako au watoto wako', icon: '🎓' },
  { id: 'home', en: 'Buy a Home', sw: 'Nunua Nyumba', fr: 'Acheter une maison', ar: 'شراء منزل', pt: 'Comprar uma casa', desc_en: 'Save toward owning your own property', desc_sw: 'Weka akiba ya kununua mali yako mwenyewe', icon: '🏠' },
];

const RISK_LEVELS = [
  { id: 'low', en: 'Low Risk', sw: 'Hatari Ndogo', color: 'var(--mk-green)', bg: 'rgba(var(--mk-green-rgb),0.1)', desc_en: 'Stable returns with capital protection. Best for beginners.', return: '5–8%' },
  { id: 'medium', en: 'Medium Risk', sw: 'Hatari ya Wastani', color: 'var(--mk-orange)', bg: 'rgba(var(--mk-orange-rgb),0.1)', desc_en: 'Balanced growth with moderate fluctuations.', return: '10–15%' },
  { id: 'high', en: 'High Risk', sw: 'Hatari Kubwa', color: 'var(--mk-red)', bg: 'rgba(var(--mk-red-rgb),0.1)', desc_en: 'Maximum growth potential. For experienced investors.', return: '18–25%' },
];

const STOCKS = [
  { id: 'GOOGL', name: 'Alphabet Inc.', symbol: 'GOOGL', price: 2650.78, change: -81.98, pct: -3.7,  market: 'NASDAQ', sector: 'Technology' },
  { id: 'AAPL',  name: 'Apple Inc.',    symbol: 'AAPL',  price: 168.88,   change: 3.67,   pct: 2.13, market: 'NASDAQ', sector: 'Technology' },
  { id: 'NVDA',  name: 'Nvidia',        symbol: 'NVDA',  price: 159.22,   change: -14.72, pct: -2.8, market: 'NASDAQ', sector: 'Technology' },
  { id: 'MSFT',  name: 'Microsoft Corp.', symbol: 'MSFT', price: 290.73,  change: -8.77,  pct: -3.0, market: 'NASDAQ', sector: 'Technology' },
  { id: 'SPOT',  name: 'Spotify Inc.', symbol: 'SPOT',   price: 189.47,   change: -4.72,  pct: -1.9, market: 'NYSE',   sector: 'Technology' },
  { id: 'AMZN',  name: 'Amazon',       symbol: 'AMZN',   price: 812.05,   change: 92.0,   pct: 6.0,  market: 'NASDAQ', sector: 'Consumer'   },
  { id: 'TSLA',  name: 'Tesla Inc.',   symbol: 'TSLA',   price: 876.35,   change: -47.04, pct: -5.1, market: 'NASDAQ', sector: 'Automotive' },
  { id: 'SCOM',  name: 'Safaricom PLC', symbol: 'SCOM',  price: 18.55,    change: 0.35,   pct: 1.92, market: 'NSE',    sector: 'Telecom'    },
];

// Branded stock logo tiles
function StockLogo({ symbol }: { symbol: string }) {
  const base: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  if (symbol === 'GOOGL') return (
    <div style={{ ...base, background: 'var(--mk-text)', border: '1px solid #E8E6E3', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    </div>
  );
  if (symbol === 'AAPL') return (
    <div style={{ ...base, background: '#1d1d1f' }}>
      <svg width="18" height="22" viewBox="0 0 814 1000" fill="white">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.1 0 661.9 0 541.8 0 349.5 131.5 247.5 261 247.5c66.1 0 121.2 43.4 162.6 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
      </svg>
    </div>
  );
  if (symbol === 'NVDA') return (
    <div style={{ ...base, background: '#76b900' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--mk-text)', letterSpacing: '-0.5px', fontFamily: 'Geist, sans-serif' }}>NVDA</span>
    </div>
  );
  if (symbol === 'MSFT') return (
    <div style={{ ...base, background: 'var(--mk-text)', border: '1px solid #E8E6E3' }}>
      <svg width="22" height="22" viewBox="0 0 22 22">
        <rect x="0"  y="0"  width="10" height="10" rx="1" fill="#F25022"/>
        <rect x="12" y="0"  width="10" height="10" rx="1" fill="#7FBA00"/>
        <rect x="0"  y="12" width="10" height="10" rx="1" fill="#00A4EF"/>
        <rect x="12" y="12" width="10" height="10" rx="1" fill="#FFB900"/>
      </svg>
    </div>
  );
  if (symbol === 'SPOT') return (
    <div style={{ ...base, background: '#1DB954' }}>
      <svg width="24" height="24" viewBox="0 0 168 168" fill="white">
        <path d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.6 121.2a5.24 5.24 0 01-7.2 1.7C95.5 110 70.4 107 40.3 114.3a5.235 5.235 0 01-2.6-10.1c33.1-8 60.9-4.5 83.7 10.7 2.5 1.6 3.3 5 1.2 7.3zm10.3-22.9c-2 3.1-6.1 4.1-9.2 2.1-17.9-11-45.2-14.2-66.4-7.8-3.5 1-7.2-1-8.3-4.5-1-3.5 1-7.2 4.5-8.3 24.2-7.3 54.3-3.8 74.9 8.9 3.2 2 4.2 6.1 2.1 9.2v.4zm.9-23.9c-21.5-12.8-57-14-77.5-7.7-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 23.5-7.1 62.6-5.7 87.3 8.9 3.7 2.2 4.9 7 2.7 10.7-2.2 3.7-7 4.9-10.7 2.7l2.8.6z"/>
      </svg>
    </div>
  );
  if (symbol === 'AMZN') return (
    <div style={{ ...base, background: '#232F3E' }}>
      <svg width="26" height="20" viewBox="0 0 110 34" fill="none">
        <text x="5" y="26" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#FF9900">a</text>
        <path d="M8 30 Q30 38 55 30 Q80 22 102 30" stroke="#FF9900" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (symbol === 'TSLA') return (
    <div style={{ ...base, background: '#E82127' }}>
      <svg width="20" height="26" viewBox="0 0 30 38" fill="white">
        <path d="M15 0 C15 0 28 2 30 8 L22 10 C22 10 20 6 15 6 C10 6 8 10 8 10 L0 8 C2 2 15 0 15 0Z"/>
        <path d="M0 8 L4 8 C4 8 4 12 8 12 L8 38 L15 38 L22 38 L22 12 C26 12 26 8 26 8 L30 8"/>
        <line x1="8" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1"/>
      </svg>
    </div>
  );
  const fallback: Record<string, string> = { SCOM: 'var(--mk-green)', EABL: 'var(--mk-red)' };
  return (
    <div style={{ ...base, background: fallback[symbol] || 'var(--mk-border)' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{symbol.slice(0, 2)}</span>
    </div>
  );
}

const PORTFOLIOS = [
  { id: 'easy_growth', name: 'Easy Growth', risk: 'Low', return: '+8.2%', value: 12450, recurring: 550, next: '15 Mar', items: ['Gov. Bonds 40%', 'Blue Chips 35%', 'Money Market 25%'], color: 'var(--mk-green)' },
  { id: 'balanced', name: 'Balanced Portfolio', risk: 'Medium', return: '+12.4%', value: 8200, recurring: 300, next: '1 Apr', items: ['Local Equities 50%', 'Fixed Income 30%', 'Real Estate 20%'], color: 'var(--mk-orange)' },
  { id: 'growth_max', name: 'Growth Max', risk: 'High', return: '+19.7%', value: 5100, recurring: 1000, next: '20 Mar', items: ['Tech Stocks 60%', 'Emerging Markets 25%', 'Crypto Index 15%'], color: 'var(--mk-red)' },
];

function generateChart(days: number, base: number, volatile: number) {
  return Array.from({ length: days }, (_, i) => ({
    i,
    v: Math.round(base + (Math.random() - 0.45) * volatile * Math.sqrt(i + 1)),
  }));
}

// ── Purpose Selection ─────────────────────────────────────────────────────────
const INVEST_PURPOSES = [
  { id: 'growth',     en: 'Financial Growth',  sw: 'Ukuaji wa Kifedha',  desc_en: 'A portfolio for financial growth over a long period of time',        desc_sw: 'Portfolio ya ukuaji wa fedha kwa muda mrefu', primary: true },
  { id: 'retirement', en: 'Retirement',         sw: 'Uzeeni',             desc_en: 'A tax-advantaged portfolio suitable for retirement',                  desc_sw: 'Portfolio inayofaa kwa uzeeni',                primary: true },
  { id: 'home',       en: 'Own a Home',         sw: 'Nunua Nyumba',       desc_en: '', desc_sw: '', primary: false },
  { id: 'family',     en: 'Start a Family',     sw: 'Anzisha Familia',    desc_en: '', desc_sw: '', primary: false },
  { id: 'business',   en: 'Start a Business',   sw: 'Anzisha Biashara',   desc_en: '', desc_sw: '', primary: false },
  { id: 'college',    en: 'For College',        sw: 'Kwa Elimu',          desc_en: '', desc_sw: '', primary: false },
];

const PURPOSE_ICONS: Record<string, string> = {
  growth: '📈', retirement: '🏖️', home: '🏠', family: '👨‍👩‍👧', business: '🏢', college: '🎓',
};

function PurposeScreen({ lang, onSelect, onBack }: { lang: string; onSelect: (id: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState('');
  const primary = INVEST_PURPOSES.filter(p => p.primary);
  const secondary = INVEST_PURPOSES.filter(p => !p.primary);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mk-bg)' }}>
      {/* Back */}
      <div style={{ padding: '16px 20px 0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronRight size={22} color="var(--mk-text)" style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      <div style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Heading */}
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', lineHeight: 1.2, marginBottom: 12 }}>
          {lang === 'sw' ? 'Mipango Yako ya Uwekezaji ni Gani?' : 'What Are Your Investment Plans?'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', lineHeight: 1.5, marginBottom: 28 }}>
          {lang === 'sw'
            ? 'Tunataka kuelewa mipango yako ili tuweze kupendekeza fursa sahihi za uwekezaji'
            : 'We want to understand your plans so we can recommend the right investment opportunities'}
        </p>

        {/* Primary purpose cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
          {primary.map(p => {
            const isSelected = selected === p.id;
            return (
              <motion.button
                key={p.id}
                onClick={() => { setSelected(p.id); onSelect(p.id); }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 16, border: 'none',
                  background: isSelected ? 'rgba(var(--mk-orange-rgb),0.1)' : 'var(--mk-card)',
                  cursor: 'pointer', textAlign: 'left',
                  outline: isSelected ? '2px solid var(--mk-orange)' : '2px solid transparent',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(var(--mk-orange-rgb),0.15)', border: '1px solid rgba(var(--mk-orange-rgb),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                  {PURPOSE_ICONS[p.id]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', marginBottom: 3 }}>
                    {lang === 'sw' ? p.sw : p.en}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', lineHeight: 1.4 }}>
                    {lang === 'sw' ? p.desc_sw : p.desc_en}
                  </p>
                </div>
                <ChevronRight size={18} color="#4B5563" style={{ flexShrink: 0 }} />
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--mk-border)', margin: '8px 0 8px' }} />

        {/* Secondary purpose list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {secondary.map((p, i) => (
            <motion.button
              key={p.id}
              onClick={() => { setSelected(p.id); onSelect(p.id); }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 0', border: 'none', background: 'transparent',
                borderBottom: i < secondary.length - 1 ? '1px solid var(--mk-border)' : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(var(--mk-purple-rgb),0.1)', border: '1px solid rgba(var(--mk-purple-rgb),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                {PURPOSE_ICONS[p.id]}
              </div>
              <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>
                {lang === 'sw' ? p.sw : p.en}
              </p>
              <ChevronRight size={18} color="#4B5563" style={{ flexShrink: 0 }} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Risk Level Selection ──────────────────────────────────────────────────────
function RiskLevelScreen({ lang, onSelect, onBack }: { lang: string; onSelect: (id: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mk-bg)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--mk-sheet)', borderBottom: '1px solid var(--mk-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="var(--mk-text)" /></button>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Kiwango cha Hatari' : 'Risk Appetite'}
          </p>
        </div>
      </div>
      <div style={{ padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>
          {lang === 'sw' ? 'Ni hatari kiasi gani unayoweza kuvumilia?' : 'How much risk are you comfortable with?'}
        </p>

        {/* Visual risk spectrum */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', padding: 20 }}>
          <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ flex: 1, background: 'var(--mk-green)' }} />
            <div style={{ flex: 1, background: 'var(--mk-orange)' }} />
            <div style={{ flex: 1, background: 'var(--mk-red)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--mk-green)', fontFamily: 'Geist, sans-serif' }}>Low</span>
            <span style={{ fontSize: 11, color: 'var(--mk-orange)', fontFamily: 'Geist, sans-serif' }}>Medium</span>
            <span style={{ fontSize: 11, color: 'var(--mk-red)', fontFamily: 'Geist, sans-serif' }}>High</span>
          </div>
        </div>

        {RISK_LEVELS.map(r => {
          const isSelected = selected === r.id;
          return (
            <motion.button
              key={r.id}
              onClick={() => setSelected(r.id)}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isSelected ? `${r.color}18` : 'var(--mk-card)',
                border: isSelected ? `2px solid ${r.color}` : '1px solid var(--mk-border)',
                borderRadius: 16, padding: '20px', cursor: 'pointer', textAlign: 'left',
                boxShadow: isSelected ? `0 0 16px ${r.color}30` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: isSelected ? r.color : 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? r.sw : r.en}
                </p>
                <div style={{
                  background: r.bg,
                  padding: '4px 10px', borderRadius: 999,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color, fontFamily: 'Geist, sans-serif' }}>
                    {r.return} {lang === 'sw' ? 'kurudi' : 'returns'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>
                {r.desc_en}
              </p>
            </motion.button>
          );
        })}

        <button
          onClick={() => selected && onSelect(selected)}
          style={{
            marginTop: 8,
            background: selected ? 'linear-gradient(135deg, var(--mk-orange), var(--mk-red))' : 'var(--mk-border)',
            color: selected ? 'var(--mk-text)' : '#4B5563',
            fontSize: 15, fontWeight: 700, padding: 16, borderRadius: 16, border: 'none',
            cursor: selected ? 'pointer' : 'default', fontFamily: 'Geist, sans-serif',
            opacity: selected ? 1 : 0.6,
            boxShadow: selected ? '0 0 20px rgba(var(--mk-orange-rgb),0.3)' : 'none',
          }}
        >
          {lang === 'sw' ? 'Anza Kuwekeza' : 'Start Investing'}
        </button>
      </div>
    </div>
  );
}

// ── Portfolio Detail ──────────────────────────────────────────────────────────
function PortfolioDetailScreen({ portfolioId, lang, fmt, onBack }: { portfolioId: string; lang: string; fmt: (n: number) => string; onBack: () => void }) {
  const portfolio = PORTFOLIOS.find(p => p.id === portfolioId) || PORTFOLIOS[0];
  const chartData = generateChart(30, portfolio.value, portfolio.value * 0.05);
  const [autoInvest, setAutoInvest] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mk-bg)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--mk-sheet)', borderBottom: '1px solid var(--mk-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="var(--mk-text)" /></button>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{portfolio.name}</p>
        </div>
      </div>
      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Portfolio hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--mk-card), var(--mk-border))', borderRadius: 20, padding: 24, border: '1px solid var(--mk-border)' }}>
          <p style={{ fontSize: 13, color: 'rgba(var(--mk-text-rgb),0.5)', fontFamily: 'Geist, sans-serif' }}>Portfolio Value</p>
          <p style={{ fontSize: 36, fontWeight: 300, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', margin: '4px 0 4px' }}>
            {fmt(portfolio.value)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} color="var(--mk-green)" />
            <span style={{ fontSize: 13, color: 'var(--mk-green)', fontFamily: 'Geist, sans-serif', fontWeight: 600 }}>{portfolio.return} this year</span>
          </div>
          <div style={{ height: 80, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke="var(--mk-orange)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Auto Invest toggle */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>Auto Invest</p>
              <p style={{ fontSize: 12, color: autoInvest ? 'var(--mk-green)' : 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>
                {autoInvest ? 'Active' : 'Inactive'}
              </p>
            </div>
            <button
              onClick={() => setAutoInvest(p => !p)}
              style={{
                width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: autoInvest ? 'var(--mk-green)' : 'var(--mk-border)',
                display: 'flex', alignItems: 'center', padding: '0 2px',
                justifyContent: autoInvest ? 'flex-end' : 'flex-start',
                boxShadow: autoInvest ? '0 0 8px rgba(var(--mk-green-rgb),0.4)' : 'none',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--mk-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            </button>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--mk-border)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>Recurring Deposit</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{fmt(portfolio.recurring)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>Next Date</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{portfolio.next}</p>
            </div>
          </div>
        </div>

        {/* Holdings breakdown */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--mk-border)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>Holdings</p>
          </div>
          {portfolio.items.map((item, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < portfolio.items.length - 1 ? '1px solid var(--mk-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{item.split(' ')[0]} {item.split(' ')[1]}</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: portfolio.color, fontFamily: 'Geist, sans-serif', background: `${portfolio.color}18`, padding: '4px 10px', borderRadius: 999 }}>
                {item.split(' ').slice(-1)[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Risk badge */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>Risk Level</p>
          <span style={{
            fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif',
            color: portfolio.color, background: `${portfolio.color}18`,
            padding: '6px 14px', borderRadius: 999,
          }}>
            {portfolio.risk}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Stocks List ───────────────────────────────────────────────────────────────
function StocksListScreen({ lang, onSelectStock, onBack }: { lang: string; fmt: (n: number) => string; onSelectStock: (id: string) => void; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? STOCKS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.symbol.toLowerCase().includes(search.toLowerCase()))
    : STOCKS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mk-bg)' }}>
      {/* Header */}
      <div style={{ position: 'relative', background: 'linear-gradient(160deg, #1a0800 0%, #2d1200 100%)', paddingBottom: 52 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ position: 'absolute', top: `${-30 + i * 38}%`, left: '-25%', right: '-25%', height: '45%', borderRadius: '50%', border: '1.5px solid rgba(var(--mk-text-rgb),0.13)', pointerEvents: 'none' }} />
        ))}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 0', position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ChevronRight size={22} color="rgba(var(--mk-text-rgb),0.9)" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
        <div style={{ padding: '16px 20px 0', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(var(--mk-text-rgb),0.15)', border: '1px solid rgba(var(--mk-text-rgb),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <TrendingUp size={24} color="var(--mk-text)" />
          </div>
          <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', marginBottom: 8 }}>
            {lang === 'sw' ? 'Hisa' : 'Stocks'}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(var(--mk-text-rgb),0.15)', borderRadius: 999, padding: '4px 10px', marginBottom: 10 }}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>High Risk</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(var(--mk-text-rgb),0.75)', fontFamily: 'Geist, sans-serif', lineHeight: 1.55 }}>
            {lang === 'sw'
              ? 'Pata faida kubwa kwa kuwekeza muda mrefu katika hisa za kimataifa.'
              : 'Earn huge returns by investing long term in stocks from major US and International companies.'}
          </p>
        </div>
        <svg style={{ position: 'absolute', bottom: -1, left: 0, right: 0, display: 'block' }} viewBox="0 0 393 52" preserveAspectRatio="none" width="100%" height="52">
          <path d="M0 52 L0 28 Q196.5 0 393 28 L393 52 Z" fill="var(--mk-bg)"/>
        </svg>
      </div>

      {/* Search bar */}
      <div style={{ padding: '4px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--mk-card)', border: '1px solid var(--mk-border)', borderRadius: 12, padding: '10px 14px' }}>
          <Search size={16} color="#4B5563" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'sw' ? 'Tafuta...' : 'Search'}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}
          />
        </div>
      </div>

      {/* Stock rows */}
      <div style={{ padding: '0 20px 100px' }}>
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', overflow: 'hidden' }}>
          {filtered.map((stock, i) => {
            const up = stock.change >= 0;
            return (
              <motion.button
                key={stock.id}
                onClick={() => onSelectStock(stock.id)}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--mk-border)' : 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                }}
              >
                <StockLogo symbol={stock.symbol} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', marginBottom: 2 }}>{stock.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>{stock.symbol}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', marginBottom: 2 }}>
                    ${stock.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: up ? 'var(--mk-green)' : 'var(--mk-red)', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: up ? 'var(--mk-green)' : 'var(--mk-red)', fontFamily: 'Geist, sans-serif' }}>
                      {up ? '+' : '-'}${Math.abs(stock.change).toFixed(2)} ({up ? '+' : ''}{stock.pct}%)
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Stock Detail ──────────────────────────────────────────────────────────────
const CHART_PERIODS = ['1d', '1m', '3m', '6m', '1y', 'All'] as const;
type ChartPeriod = typeof CHART_PERIODS[number];

const STOCK_NEWS: Record<string, { title: string; date: string }[]> = {
  AAPL: [
    { title: 'Apple Stock Is Up 50% This Year. What\'s Going On?', date: 'Today' },
    { title: 'Apple Stock Target Raised to $215 Ahead Of $4 Billion Netflix Competitor Launch', date: '2 Feb, 2025' },
    { title: 'Apple (AAPL) Stock Sets New All-Time High – Will It Stay There?', date: '17 Jan, 2025' },
    { title: 'Apple stock drop makes history with $179B loss', date: '11 Jan, 2025' },
  ],
  GOOGL: [
    { title: 'Alphabet beats earnings estimates as AI investments pay off', date: 'Today' },
    { title: 'Google Search ad revenue hits record high in Q4', date: '5 Feb, 2025' },
    { title: 'Alphabet announces $70B share buyback program', date: '20 Jan, 2025' },
  ],
};
const DEFAULT_NEWS = [
  { title: 'Stock surges amid strong quarterly earnings report', date: 'Today' },
  { title: 'Analysts raise price target following product launch', date: '3 Feb, 2025' },
  { title: 'Institutional investors increase stake by 12%', date: '18 Jan, 2025' },
];

function StockDetailScreen({ stockId, lang, onBack }: { stockId: string; lang: string; fmt: (n: number) => string; onBack: () => void }) {
  const stock = STOCKS.find(s => s.id === stockId) || STOCKS[1];
  const up = stock.change >= 0;
  const [period, setPeriod] = useState<ChartPeriod>('1d');
  const chartData = generateChart(
    period === '1d' ? 24 : period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365,
    stock.price * 100,
    stock.price * (period === '1d' ? 2 : period === '1m' ? 5 : 10)
  );

  const ownership = stock.price * 148;
  const ownershipGain = ownership * 0.281;
  const news = STOCK_NEWS[stock.symbol] || DEFAULT_NEWS;

  const summaryRows = [
    [{ label: 'Open',     value: (stock.price * 0.998).toFixed(2) },  { label: 'Mkt Cap',   value: stock.symbol === 'AAPL' ? '3.1T' : stock.symbol === 'GOOGL' ? '2.1T' : `${(stock.price * 8.6).toFixed(0)}B` }],
    [{ label: 'High',     value: (stock.price * 1.009).toFixed(2) },  { label: 'P/E ratio', value: stock.symbol === 'AAPL' ? '27.60' : '24.30' }],
    [{ label: 'Low',      value: (stock.price * 0.989).toFixed(2) },  { label: 'Div yield', value: '0.53' }],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mk-bg)' }}>
      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--mk-sheet)', borderBottom: '1px solid var(--mk-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={22} color="var(--mk-text)" />
          </button>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{stock.name.split(' ')[0]}</p>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <MoreHorizontal size={20} color="#4B5563" />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Price hero */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <StockLogo symbol={stock.symbol} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{stock.name}</p>
              <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>{stock.symbol}</p>
            </div>
          </div>
          <p style={{ fontSize: 36, fontWeight: 300, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', margin: '0 0 6px' }}>
            ${stock.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: up ? 'var(--mk-green)' : 'var(--mk-red)', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: up ? 'var(--mk-green)' : 'var(--mk-red)', fontFamily: 'Geist, sans-serif' }}>
              {up ? '+' : '-'}${Math.abs(stock.change).toFixed(2)} ({up ? '+' : ''}{stock.pct}%) today
            </span>
          </div>

          {/* Buy / Sell */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button style={{ flex: 1, padding: '10px 0', borderRadius: 999, background: 'linear-gradient(135deg, var(--mk-orange), var(--mk-red))', border: 'none', color: 'var(--mk-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Geist, sans-serif', boxShadow: '0 0 12px rgba(var(--mk-orange-rgb),0.3)' }}>
              {lang === 'sw' ? 'Nunua' : 'Buy'}
            </button>
            <button style={{ flex: 1, padding: '10px 0', borderRadius: 999, background: 'transparent', border: '1.5px solid var(--mk-orange)', color: 'var(--mk-orange)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Uza' : 'Sell'}
            </button>
          </div>

          {/* Chart */}
          <div style={{ height: 140, margin: '0 -4px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="i" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip formatter={(v: any) => `$${(v / 100).toFixed(2)}`} contentStyle={{ borderRadius: 8, border: '1px solid var(--mk-border)', background: 'var(--mk-card)', color: 'var(--mk-text)', fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke={up ? 'var(--mk-green)' : 'var(--mk-red)'} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, background: 'var(--mk-sheet)', borderRadius: 10, padding: 4 }}>
            {CHART_PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: period === p ? 'var(--mk-border)' : 'transparent',
                  color: period === p ? 'var(--mk-text)' : '#4B5563',
                  fontSize: 11, fontWeight: period === p ? 700 : 400, fontFamily: 'Geist, sans-serif',
                  boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  transition: 'background 0.15s',
                }}
              >{p}</button>
            ))}
          </div>
        </div>

        {/* Ownership */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', marginBottom: 6 }}>
            {lang === 'sw' ? 'Umiliki' : 'Ownership'}
          </p>
          <p style={{ fontSize: 30, fontWeight: 300, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            ${ownership.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mk-green)', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--mk-green)', fontWeight: 600, fontFamily: 'Geist, sans-serif' }}>
              +${ownershipGain.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (28.1%)
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', marginBottom: 12 }}>148 units</p>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--mk-border)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: '11%', height: '100%', background: 'var(--mk-green)', borderRadius: 999 }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Ni 11% ya portfolio yako' : 'Constitutes 11% of your portfolio'}
          </p>
        </div>

        {/* Summary grid */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Muhtasari' : 'Summary'}
            </p>
          </div>
          {summaryRows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', borderTop: ri === 0 ? '1px solid var(--mk-border)' : 'none' }}>
              {row.map((cell, ci) => (
                <div key={ci} style={{ flex: 1, padding: '12px 20px', borderRight: ci === 0 ? '1px solid var(--mk-border)' : 'none', borderTop: ri > 0 ? '1px solid var(--mk-border)' : 'none' }}>
                  <p style={{ fontSize: 11, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', marginBottom: 4 }}>{cell.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{cell.value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* News */}
        <div style={{ background: 'var(--mk-card)', borderRadius: 16, border: '1px solid var(--mk-border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 4px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? 'Habari' : 'News'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', marginTop: 2 }}>
              {lang === 'sw' ? `Habari za ${stock.name.split(' ')[0]}` : `See what's happening with ${stock.name.split(' ')[0]}`}
            </p>
          </div>
          {news.slice(0, 3).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: '1px solid var(--mk-border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', lineHeight: 1.4, marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif' }}>{item.date}</p>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: `hsl(${(i * 47 + 20)}, 70%, 35%)`, flexShrink: 0 }} />
            </div>
          ))}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--mk-border)' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--mk-orange)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif', padding: 0 }}>
              {lang === 'sw' ? 'Tazama zaidi' : 'See more'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Start Investing ───────────────────────────────────────────────────────────
function StartInvestingScreen({ lang, onStart, onBack }: { lang: string; onStart: () => void; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mk-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
        <button onClick={onBack} style={{ background: 'rgba(var(--mk-text-rgb),0.08)', border: '1px solid var(--mk-border)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color="var(--mk-text)" />
        </button>
      </div>

      {/* Illustration */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', gap: 32 }}>
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(var(--mk-orange-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(var(--mk-orange-rgb),0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={56} color="var(--mk-orange)" />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif', marginBottom: 12 }}>
            {lang === 'sw' ? 'Anza Kuwekeza Leo' : 'Start Investing Today'}
          </p>
          <p style={{ fontSize: 15, color: 'var(--mk-text-secondary)', fontFamily: 'Geist, sans-serif', lineHeight: 1.6 }}>
            {lang === 'sw'
              ? 'Unda utajiri wa muda mrefu kwa uwekezaji mdogo. Tunaanza safari yako ya kifedha pamoja.'
              : 'Build long-term wealth with small, consistent investments. We\'ll guide you every step of the way.'}
          </p>
        </div>

        {/* Feature bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {[
            { icon: '🌍', text: lang === 'sw' ? 'Hisa za Afrika na Ulimwengu' : 'African & global stocks' },
            { icon: '🤖', text: lang === 'sw' ? 'Uwekezaji wa kiotomatiki' : 'Automated investing' },
            { icon: '📊', text: lang === 'sw' ? 'Uchambuzi wa wakati halisi' : 'Real-time analytics' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--mk-card)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--mk-border)' }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <p style={{ fontSize: 14, color: 'var(--mk-text)', fontFamily: 'Geist, sans-serif' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 20px 40px' }}>
        <button
          onClick={onStart}
          style={{
            width: '100%', background: 'linear-gradient(135deg, var(--mk-orange), var(--mk-red))', color: 'var(--mk-text)',
            fontSize: 16, fontWeight: 700, padding: 18, borderRadius: 16,
            border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif',
            boxShadow: '0 0 24px rgba(var(--mk-orange-rgb),0.4)',
          }}
        >
          {lang === 'sw' ? 'Anza Sasa' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function InvestDetailView({ initialView, portfolioName, stockName, onBack }: Props) {
  const { state } = useApp();
  const lang = state.language;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const [view, setView] = useState<View | 'startInvesting'>(
    initialView === 'riskLevel' ? 'startInvesting' : initialView
  );
  const [selectedPortfolio, setSelectedPortfolio] = useState(portfolioName || 'easy_growth');
  const [selectedStock, setSelectedStock] = useState(stockName || 'AAPL');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.15 }}
        style={{ position: 'absolute', inset: 0, zIndex: 50, overflowY: 'auto' }}
      >
        {view === 'startInvesting' && (
          <StartInvestingScreen lang={lang} onBack={onBack} onStart={() => setView('purpose')} />
        )}
        {view === 'purpose' && (
          <PurposeScreen lang={lang} onBack={onBack} onSelect={() => setView('riskLevel')} />
        )}
        {view === 'riskLevel' && (
          <RiskLevelScreen lang={lang} onBack={() => setView('purpose')} onSelect={() => { onBack(); }} />
        )}
        {view === 'portfolioDetail' && (
          <PortfolioDetailScreen portfolioId={selectedPortfolio} lang={lang} fmt={fmt} onBack={onBack} />
        )}
        {view === 'stocksList' && (
          <StocksListScreen lang={lang} fmt={fmt} onBack={onBack} onSelectStock={(id) => { setSelectedStock(id); setView('stockDetail'); }} />
        )}
        {view === 'stockDetail' && (
          <StockDetailScreen stockId={selectedStock} lang={lang} fmt={fmt} onBack={() => setView('stocksList')} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export { PORTFOLIOS, STOCKS };
