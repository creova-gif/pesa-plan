import { useState } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Check, Sprout } from 'lucide-react';
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
  { id: 'low', en: 'Low Risk', sw: 'Hatari Ndogo', color: '#4E886F', bg: 'rgba(78,136,111,0.1)', desc_en: 'Stable returns with capital protection. Best for beginners.', return: '5–8%' },
  { id: 'medium', en: 'Medium Risk', sw: 'Hatari ya Wastani', color: '#FD8240', bg: 'rgba(253,130,64,0.1)', desc_en: 'Balanced growth with moderate fluctuations.', return: '10–15%' },
  { id: 'high', en: 'High Risk', sw: 'Hatari Kubwa', color: '#C9362B', bg: 'rgba(201,54,43,0.1)', desc_en: 'Maximum growth potential. For experienced investors.', return: '18–25%' },
];

const STOCKS = [
  { id: 'AAPL', name: 'Apple Inc.', symbol: 'AAPL', price: 189.30, change: 1.24, pct: 0.66, market: 'NASDAQ', sector: 'Technology', color: '#4D4845' },
  { id: 'GOOGL', name: 'Alphabet Inc.', symbol: 'GOOGL', price: 2650.78, change: 32.10, pct: 1.23, market: 'NASDAQ', sector: 'Technology', color: '#4E886F' },
  { id: 'MSFT', name: 'Microsoft Corp.', symbol: 'MSFT', price: 378.85, change: -2.45, pct: -0.64, market: 'NASDAQ', sector: 'Technology', color: '#FD8240' },
  { id: 'SAFARICOM', name: 'Safaricom PLC', symbol: 'SCOM', price: 18.55, change: 0.35, pct: 1.92, market: 'NSE', sector: 'Telecom', color: '#4E886F' },
  { id: 'EABL', name: 'East African Breweries', symbol: 'EABL', price: 155.00, change: -1.50, pct: -0.96, market: 'NSE', sector: 'Consumer', color: '#C9362B' },
];

const PORTFOLIOS = [
  { id: 'easy_growth', name: 'Easy Growth', risk: 'Low', return: '+8.2%', value: 12450, recurring: 550, next: '15 Mar', items: ['Gov. Bonds 40%', 'Blue Chips 35%', 'Money Market 25%'], color: '#4E886F' },
  { id: 'balanced', name: 'Balanced Portfolio', risk: 'Medium', return: '+12.4%', value: 8200, recurring: 300, next: '1 Apr', items: ['Local Equities 50%', 'Fixed Income 30%', 'Real Estate 20%'], color: '#FD8240' },
  { id: 'growth_max', name: 'Growth Max', risk: 'High', return: '+19.7%', value: 5100, recurring: 1000, next: '20 Mar', items: ['Tech Stocks 60%', 'Emerging Markets 25%', 'Crypto Index 15%'], color: '#C9362B' },
];

function generateChart(days: number, base: number, volatile: number) {
  return Array.from({ length: days }, (_, i) => ({
    i,
    v: Math.round(base + (Math.random() - 0.45) * volatile * Math.sqrt(i + 1)),
  }));
}

// ── Purpose Selection ─────────────────────────────────────────────────────────
function PurposeScreen({ lang, onSelect, onBack }: { lang: string; onSelect: (id: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F6F6F4' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #F4F4F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="#4D4845" /></button>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Lengo la Uwekezaji' : 'Investment Purpose'}
          </p>
        </div>
      </div>
      <div style={{ padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif', marginBottom: 8 }}>
          {lang === 'sw' ? 'Chagua lengo lako kuu la uwekezaji' : 'Choose your primary investment goal'}
        </p>
        {PURPOSES.map(p => {
          const isSelected = selected === p.id;
          return (
            <motion.button
              key={p.id}
              onClick={() => setSelected(p.id)}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isSelected ? '#1A3D2E' : '#fff',
                border: isSelected ? '2px solid #4E886F' : '1px solid #F4F4F2',
                borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 32 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: isSelected ? '#fff' : '#4D4845', fontFamily: 'Geist, sans-serif', marginBottom: 4 }}>
                  {(p as any)[lang] || p.en}
                </p>
                <p style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.6)' : '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                  {(p as any)[`desc_${lang}`] || p.desc_en}
                </p>
              </div>
              {isSelected && <Check size={18} color="#FD8240" />}
            </motion.button>
          );
        })}
        <button
          onClick={() => selected && onSelect(selected)}
          style={{
            marginTop: 8, background: selected ? '#4E886F' : '#E5E3E0', color: '#fff',
            fontSize: 15, fontWeight: 600, padding: 16, borderRadius: 16, border: 'none',
            cursor: selected ? 'pointer' : 'default', fontFamily: 'Geist, sans-serif',
            opacity: selected ? 1 : 0.6,
          }}
        >
          {lang === 'sw' ? 'Endelea' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ── Risk Level Selection ──────────────────────────────────────────────────────
function RiskLevelScreen({ lang, onSelect, onBack }: { lang: string; onSelect: (id: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F6F6F4' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #F4F4F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="#4D4845" /></button>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Kiwango cha Hatari' : 'Risk Appetite'}
          </p>
        </div>
      </div>
      <div style={{ padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
          {lang === 'sw' ? 'Ni hatari kiasi gani unayoweza kuvumilia?' : 'How much risk are you comfortable with?'}
        </p>

        {/* Visual risk spectrum */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', padding: 20 }}>
          <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ flex: 1, background: '#4E886F' }} />
            <div style={{ flex: 1, background: '#FD8240' }} />
            <div style={{ flex: 1, background: '#C9362B' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#4E886F', fontFamily: 'Geist, sans-serif' }}>Low</span>
            <span style={{ fontSize: 11, color: '#FD8240', fontFamily: 'Geist, sans-serif' }}>Medium</span>
            <span style={{ fontSize: 11, color: '#C9362B', fontFamily: 'Geist, sans-serif' }}>High</span>
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
                background: isSelected ? r.color : '#fff',
                border: isSelected ? `2px solid ${r.color}` : '1px solid #F4F4F2',
                borderRadius: 16, padding: '20px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: isSelected ? '#fff' : '#4D4845', fontFamily: 'Geist, sans-serif' }}>
                  {lang === 'sw' ? r.sw : r.en}
                </p>
                <div style={{
                  background: isSelected ? 'rgba(255,255,255,0.2)' : r.bg,
                  padding: '4px 10px', borderRadius: 999,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#fff' : r.color, fontFamily: 'Geist, sans-serif' }}>
                    {r.return} {lang === 'sw' ? 'kurudi' : 'returns'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: isSelected ? 'rgba(255,255,255,0.75)' : '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {r.desc_en}
              </p>
            </motion.button>
          );
        })}

        <button
          onClick={() => selected && onSelect(selected)}
          style={{
            marginTop: 8, background: selected ? '#4E886F' : '#E5E3E0', color: '#fff',
            fontSize: 15, fontWeight: 600, padding: 16, borderRadius: 16, border: 'none',
            cursor: selected ? 'pointer' : 'default', fontFamily: 'Geist, sans-serif',
            opacity: selected ? 1 : 0.6,
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F6F6F4' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #F4F4F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="#4D4845" /></button>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{portfolio.name}</p>
        </div>
      </div>
      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Portfolio hero */}
        <div style={{ background: '#1A3D2E', borderRadius: 20, padding: 24 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'Geist, sans-serif' }}>Portfolio Value</p>
          <p style={{ fontSize: 36, fontWeight: 300, color: '#fff', fontFamily: 'Geist, sans-serif', margin: '4px 0 4px' }}>
            {fmt(portfolio.value)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} color="#4E886F" />
            <span style={{ fontSize: 13, color: '#4E886F', fontFamily: 'Geist, sans-serif', fontWeight: 600 }}>{portfolio.return} this year</span>
          </div>
          <div style={{ height: 80, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke="#FD8240" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Auto Invest toggle */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>Auto Invest</p>
              <p style={{ fontSize: 12, color: autoInvest ? '#4E886F' : '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                {autoInvest ? 'Active' : 'Inactive'}
              </p>
            </div>
            <button
              onClick={() => setAutoInvest(p => !p)}
              style={{
                width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: autoInvest ? '#4E886F' : '#E5E3E0',
                display: 'flex', alignItems: 'center', padding: '0 2px',
                justifyContent: autoInvest ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F4F4F2', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>Recurring Deposit</p>
              <p style={{ fontSize: 18, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{fmt(portfolio.recurring)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>Next Date</p>
              <p style={{ fontSize: 18, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{portfolio.next}</p>
            </div>
          </div>
        </div>

        {/* Holdings breakdown */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F4F4F2' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>Holdings</p>
          </div>
          {portfolio.items.map((item, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < portfolio.items.length - 1 ? '1px solid #F4F4F2' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{item.split(' ')[0]} {item.split(' ')[1]}</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: portfolio.color, fontFamily: 'Geist, sans-serif', background: `${portfolio.color}15`, padding: '4px 10px', borderRadius: 999 }}>
                {item.split(' ').slice(-1)[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Risk badge */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>Risk Level</p>
          <span style={{
            fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif',
            color: portfolio.color, background: `${portfolio.color}15`,
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
function StocksListScreen({ lang, fmt, onSelectStock, onBack }: { lang: string; fmt: (n: number) => string; onSelectStock: (id: string) => void; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F6F6F4' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #F4F4F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="#4D4845" /></button>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>
            {lang === 'sw' ? 'Hisa' : 'Stocks & Assets'}
          </p>
        </div>
      </div>
      <div style={{ padding: '12px 20px 100px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', overflow: 'hidden' }}>
          {STOCKS.map((stock, i) => {
            const up = stock.change >= 0;
            return (
              <button
                key={stock.id}
                onClick={() => onSelectStock(stock.id)}
                style={{
                  width: '100%', padding: '16px 20px', background: 'none', border: 'none',
                  borderBottom: i < STOCKS.length - 1 ? '1px solid #F4F4F2' : 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: `${stock.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color: stock.color, fontFamily: 'Geist, sans-serif', flexShrink: 0,
                }}>
                  {stock.symbol.slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{stock.name}</p>
                  <p style={{ fontSize: 12, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{stock.symbol} · {stock.market}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>${stock.price.toFixed(2)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                    {up ? <TrendingUp size={12} color="#4E886F" /> : <TrendingDown size={12} color="#C9362B" />}
                    <span style={{ fontSize: 12, color: up ? '#4E886F' : '#C9362B', fontFamily: 'Geist, sans-serif' }}>
                      {up ? '+' : ''}{stock.pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color="#A6A4A0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Stock Detail ──────────────────────────────────────────────────────────────
function StockDetailScreen({ stockId, lang, fmt, onBack }: { stockId: string; lang: string; fmt: (n: number) => string; onBack: () => void }) {
  const stock = STOCKS.find(s => s.id === stockId) || STOCKS[0];
  const up = stock.change >= 0;
  const chartData = generateChart(90, stock.price * 100, stock.price * 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F6F6F4' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #F4F4F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', height: 56 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} color="#4D4845" /></button>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{stock.symbol}</p>
        </div>
      </div>
      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Price hero */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', padding: 20 }}>
          <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{stock.name}</p>
          <p style={{ fontSize: 36, fontWeight: 300, color: '#4D4845', fontFamily: 'Geist, sans-serif', margin: '4px 0' }}>
            ${stock.price.toFixed(2)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            {up ? <TrendingUp size={16} color="#4E886F" /> : <TrendingDown size={16} color="#C9362B" />}
            <span style={{ fontSize: 14, fontWeight: 600, color: up ? '#4E886F' : '#C9362B', fontFamily: 'Geist, sans-serif' }}>
              {up ? '+' : ''}${stock.change.toFixed(2)} ({up ? '+' : ''}{stock.pct.toFixed(2)}%) today
            </span>
          </div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="i" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip formatter={(v: any) => `$${(v / 100).toFixed(2)}`} />
                <Line type="monotone" dataKey="v" stroke={up ? '#4E886F' : '#C9362B'} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock info */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F4F4F2', overflow: 'hidden' }}>
          {[
            { label: 'Market', value: stock.market },
            { label: 'Sector', value: stock.sector },
            { label: '52W High', value: `$${(stock.price * 1.35).toFixed(2)}` },
            { label: '52W Low', value: `$${(stock.price * 0.72).toFixed(2)}` },
          ].map((row, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < 3 ? '1px solid #F4F4F2' : 'none', display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#4D4845', fontFamily: 'Geist, sans-serif' }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Add to portfolio CTA */}
        <button
          style={{
            background: up ? '#4E886F' : '#C9362B', color: '#fff',
            fontSize: 15, fontWeight: 600, padding: 16, borderRadius: 16,
            border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif',
          }}
        >
          {lang === 'sw' ? 'Ongeza kwenye Portfolio' : 'Add to Portfolio'}
        </button>
      </div>
    </div>
  );
}

// ── Start Investing ───────────────────────────────────────────────────────────
function StartInvestingScreen({ lang, onStart, onBack }: { lang: string; onStart: () => void; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#1A3D2E' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
      </div>

      {/* Illustration */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', gap: 32 }}>
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(253,130,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(253,130,64,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={56} color="#FD8240" />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Geist, sans-serif', marginBottom: 12 }}>
            {lang === 'sw' ? 'Anza Kuwekeza Leo' : 'Start Investing Today'}
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', fontFamily: 'Geist, sans-serif', lineHeight: 1.6 }}>
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
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Geist, sans-serif' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 20px 40px' }}>
        <button
          onClick={onStart}
          style={{
            width: '100%', background: '#FD8240', color: '#fff',
            fontSize: 16, fontWeight: 700, padding: 18, borderRadius: 16,
            border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif',
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
