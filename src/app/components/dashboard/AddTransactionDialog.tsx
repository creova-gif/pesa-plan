import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Sparkles, Camera, Loader2 } from 'lucide-react';
import { useApp, type TransactionType, type PaymentSource } from '@/app/App';
import { t } from '@/app/utils/translations';
import { toast } from 'sonner';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { REGION_CONFIG, type Region } from '@/app/utils/currency';
import { browserStorage, readAiConsent, writeAiConsent } from '@/lib/aiConsent.mjs';
import { cloudAiEnabled, getAiAccessToken, requestReceiptScan } from '@/lib/aiClient';
import { AiConsentNotice } from './AiConsentNotice';

// ── Feature 1: Auto-categorization keyword map ──────────────────────────────
const KEYWORD_MAP: Array<{ keywords: string[]; cat: { sw: string; en: string } }> = [
  { keywords: ['kfc', 'pizza', 'chicken', 'ugali', 'nyama', 'pilau', 'mkate', 'chakula', 'food', 'restaurant', 'hotel', 'samaki', 'chips', 'sambusa', 'mandazi', 'mahindi', 'mchuzi', 'wali', 'chapati', 'biryani', 'lunch', 'dinner', 'breakfast', 'chakula'], cat: { sw: 'Chakula', en: 'Food' } },
  { keywords: ['uber', 'boda', 'daladala', 'bus', 'taxi', 'gari', 'petrol', 'mafuta', 'transport', 'usafiri', 'bajaj', 'pikipiki', 'train', 'reli', 'dalla'], cat: { sw: 'Usafiri', en: 'Transport' } },
  { keywords: ['vodacom', 'airtel', 'tigo', 'data', 'internet', 'bundle', 'muda', 'airtime', 'sim', 'wifi', 'recharge', 'topup', 'halotel'], cat: { sw: 'Data na Muda', en: 'Data & Airtime' } },
  { keywords: ['kodi', 'rent', 'nyumba', 'landlord', 'house', 'apartment', 'kibanda'], cat: { sw: 'Kodi', en: 'Rent' } },
  { keywords: ['dawa', 'hospital', 'clinic', 'daktari', 'health', 'afya', 'medicine', 'pharmacy', 'doctor', 'test', 'dispensary'], cat: { sw: 'Afya', en: 'Health' } },
  { keywords: ['netflix', 'spotify', 'gym', 'sinema', 'cinema', 'game', 'burudani', 'entertainment', 'music', 'movie', 'starehe', 'jumia', 'shopping', 'clothes', 'nguo'], cat: { sw: 'Burudani', en: 'Entertainment' } },
  { keywords: ['biashara', 'stock', 'inventory', 'business', 'shop', 'duka', 'merchandise', 'goods', 'wholesale', 'retail'], cat: { sw: 'Biashara', en: 'Business' } },
  { keywords: ['luku', 'umeme', 'stima', 'maji', 'water', 'bill', 'malipo', 'tanesco', 'dawasa', 'dawasco', 'electricity', 'utility'], cat: { sw: 'Malipo', en: 'Bills' } },
  { keywords: ['watoto', 'school', 'ada', 'familia', 'family', 'mtoto', 'ndugu', 'shangazi', 'baba', 'mama', 'fees', 'tuition', 'shule'], cat: { sw: 'Familia', en: 'Family' } },
];

function autoDetectCategory(notes: string, lang: 'sw' | 'en'): string | null {
  if (!notes.trim()) return null;
  const lower = notes.toLowerCase();
  for (const { keywords, cat } of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return cat[lang];
  }
  return null;
}

interface AddTransactionDialogProps {
  type: TransactionType;
  onClose: () => void;
  prefilledCategory?: string;
  prefilledAmount?: number;
}

const EXPENSE_CATEGORIES = {
  sw: ['Chakula', 'Usafiri', 'Kodi', 'Malipo', 'Data na Muda', 'Biashara', 'Afya', 'Burudani', 'Familia', 'Akiba'],
  en: ['Food', 'Transport', 'Rent', 'Bills', 'Data & Airtime', 'Business', 'Health', 'Entertainment', 'Family', 'Savings'],
};
const INCOME_CATEGORIES = {
  sw: ['Mishahara', 'Biashara', 'Kazi ya Muda', 'Kilimo', 'Kodi', 'Zawadi', 'Serikali', 'Nyingine'],
  en: ['Salary', 'Business', 'Freelance', 'Farming', 'Rental', 'Gift', 'Government', 'Other'],
};

const SOURCES: PaymentSource[] = ['cash', 'mpesa', 'airtel', 'tigo', 'bank'];
const SOURCE_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Taslimu', en: 'Cash' },
  mpesa: { sw: 'M-Pesa', en: 'M-Pesa' },
  airtel: { sw: 'Airtel', en: 'Airtel' },
  tigo: { sw: 'Tigo', en: 'Tigo' },
  bank: { sw: 'Benki', en: 'Bank' },
};

// Time-based, region-aware amount suggestions
function getQuickAmounts(region: Region): number[] {
  const cfg = REGION_CONFIG[region];
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return cfg.quickAmounts[0];
  if (hour >= 11 && hour < 15) return cfg.quickAmounts[1];
  if (hour >= 17 && hour < 22) return cfg.quickAmounts[2];
  return cfg.quickAmounts[3];
}

export function AddTransactionDialog({ type, onClose, prefilledCategory, prefilledAmount }: AddTransactionDialogProps) {
  const { state, addTransaction } = useApp();
  const lang = state.language;

  const [amount, setAmount] = useState(prefilledAmount ? prefilledAmount.toString() : '');
  const [category, setCategory] = useState(prefilledCategory || '');
  const [source, setSource] = useState<PaymentSource>('cash');
  const [notes, setNotes] = useState('');
  const [autoDetected, setAutoDetected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regionCfg = REGION_CONFIG[state.region];
  const symbol = regionCfg.symbol;
  const MAX_AMOUNT = regionCfg.maxTransactionAmount;

  const handleAmountChange = (value: string) => {
    setAmountError(null);
    const num = parseFloat(value);
    if (value && num > MAX_AMOUNT) {
      setAmountError(lang === 'sw' ? `Kiwango cha juu: ${symbol} ${MAX_AMOUNT.toLocaleString()}` : `Maximum: ${symbol} ${MAX_AMOUNT.toLocaleString()}`);
      return;
    }
    if (value && num < 0) {
      setAmountError(lang === 'sw' ? 'Kiasi hakiwezi kuwa hasi' : 'Amount cannot be negative');
      return;
    }
    setAmount(value);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (type === 'expense') {
      const detected = autoDetectCategory(value, lang);
      if (detected && detected !== category) {
        setAutoDetected(detected);
      } else if (!detected) {
        setAutoDetected(null);
      }
    }
  };

  const applyAutoDetected = () => {
    if (autoDetected) {
      setCategory(autoDetected);
      setAutoDetected(null);
    }
  };

  // Smart suggestions from recent transactions
  const smartSuggestions = useMemo(() => {
    const recent = state.transactions
      .filter(tx => tx.type === 'expense')
      .slice(0, 20);
    const freq: Record<string, { count: number; totalAmount: number; source: PaymentSource }> = {};
    recent.forEach(tx => {
      if (!freq[tx.category]) freq[tx.category] = { count: 0, totalAmount: 0, source: tx.source };
      freq[tx.category].count++;
      freq[tx.category].totalAmount += tx.amount;
      freq[tx.category].source = tx.source;
    });
    return Object.entries(freq)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([cat, data]) => ({
        category: cat,
        amount: Math.round(data.totalAmount / data.count),
        source: data.source,
      }));
  }, [state.transactions]);

  const handleQuickFill = (suggestion: { category: string; amount: number; source: PaymentSource }) => {
    setCategory(suggestion.category);
    setAmount(suggestion.amount.toString());
    setSource(suggestion.source);
  };

  const receiptUnavailable = () => {
    toast.error(lang === 'sw' ? 'Usomaji wa risiti haupatikani.' : 'Receipt scanning is unavailable.');
  };

  const openReceiptPicker = async () => {
    const enabled = await cloudAiEnabled();
    const token = enabled ? await getAiAccessToken() : null;
    if (!enabled || !token) {
      receiptUnavailable();
      return;
    }
    if (readAiConsent(browserStorage()) !== 'granted') {
      setShowConsent(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleReceiptScan = async (file: File) => {
    if (readAiConsent(browserStorage()) !== 'granted') {
      setShowConsent(true);
      return;
    }
    const mediaType = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp'
      ? file.type
      : file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === ''
        ? 'image/jpeg'
        : null;
    if (!mediaType) {
      toast.error(lang === 'sw' ? 'Aina ya picha haitumiki.' : 'Unsupported image type.');
      return;
    }
    if (file.size > 1_000_000) {
      toast.error(lang === 'sw' ? 'Picha ni kubwa sana.' : 'Image is too large.');
      return;
    }
    const token = await getAiAccessToken();
    if (!token) {
      receiptUnavailable();
      return;
    }

    setIsScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await requestReceiptScan({ mediaType, data: base64 }, token);
      if (!result.ok) {
        toast.error(result.reason === 'not_receipt'
          ? (lang === 'sw' ? 'Picha si risiti — jaribu tena' : 'Image is not a receipt — try again')
          : (lang === 'sw' ? 'Imeshindwa kusoma risiti — jaribu tena' : 'Failed to read receipt — try again'));
        return;
      }

      if (result.amount && Number.isFinite(result.amount)) {
        setAmount(String(Math.round(result.amount)));
      }
      if (result.notes) {
        setNotes(result.notes);
        const detected = autoDetectCategory(result.notes, lang);
        if (detected) setCategory(detected);
      }
      if (result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
        const today = new Date().toISOString().split('T')[0];
        if (result.date <= today) setSelectedDate(result.date);
      }

      toast.success(lang === 'sw' ? '📷 Risiti imetambuliwa!' : '📷 Receipt scanned!', { duration: 2000 });
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kusoma risiti — jaribu tena' : 'Failed to read receipt — try again');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return; // prevent double-submit
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error(lang === 'sw' ? 'Ingiza kiasi sahihi zaidi ya sifuri' : 'Enter a valid amount greater than zero');
      return;
    }
    if (parsed > MAX_AMOUNT) {
      toast.error(lang === 'sw' ? `Kiwango cha juu ni ${symbol} ${MAX_AMOUNT.toLocaleString()}` : `Maximum amount is ${symbol} ${MAX_AMOUNT.toLocaleString()}`);
      return;
    }
    if (!Number.isFinite(parsed)) {
      toast.error(lang === 'sw' ? 'Kiasi si sahihi' : 'Invalid amount');
      return;
    }
    if (!category) {
      toast.error(lang === 'sw' ? 'Chagua aina ya muamala' : 'Select a category');
      return;
    }

    setIsSubmitting(true);

    // Round-up notification
    if (state.roundUpEnabled && type === 'expense') {
      const roundUpTo = Math.ceil(parsed / 500) * 500;
      const roundUp = roundUpTo - parsed;
      if (roundUp > 0 && roundUp < 500) {
        toast.success(`🪙 +${symbol} ${roundUp.toLocaleString()} ${lang === 'sw' ? 'imeokolewa (Round-up)' : 'saved (round-up)'}`, { duration: 2500 });
      }
    }

    const txDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
    addTransaction({ type, amount: parsed, category, source, notes, date: txDate });
    toast.success(
      type === 'expense'
        ? `✓ ${category} – ${symbol} ${parsed.toLocaleString()}`
        : (lang === 'sw' ? `✓ Mapato – ${symbol} ${parsed.toLocaleString()}` : `✓ Income – ${symbol} ${parsed.toLocaleString()}`),
      { duration: 2000 }
    );
    onClose();
  };

  const isExpense = type === 'expense';
  const headerBg = isExpense ? 'linear-gradient(135deg, var(--mk-red), var(--mk-orange))' : 'linear-gradient(135deg, #00C48C, var(--mk-green))';

  const quickAmounts = getQuickAmounts(state.region);
  const categories = isExpense ? EXPENSE_CATEGORIES[lang] : INCOME_CATEGORIES[lang];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={isExpense ? (lang === 'sw' ? 'Ongeza Matumizi' : 'Add Expense') : (lang === 'sw' ? 'Ongeza Mapato' : 'Add Income')}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          style={{ background: 'var(--mk-sheet)', border: '1px solid var(--mk-border)', borderBottom: 'none' }}
          className="w-full rounded-t-3xl max-h-[92vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Colored header */}
          <div className="text-white px-5 pt-5 pb-6 rounded-t-3xl" style={{ background: headerBg, boxShadow: isExpense ? '0 4px 24px rgba(var(--mk-red-rgb),0.2)' : '0 4px 24px rgba(var(--mk-green-rgb),0.2)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">
                {isExpense ? t('addExpense', lang) : t('addIncome', lang)}
              </h2>
              <div className="flex items-center gap-2">
                {isExpense && (
                  <button
                    onClick={() => { void openReceiptPicker(); }}
                    disabled={isScanning}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition flex items-center gap-1.5 px-2.5 disabled:opacity-50"
                    title={lang === 'sw' ? 'Piga picha ya risiti' : 'Scan receipt'}
                  >
                    {isScanning
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Camera className="w-3.5 h-3.5" />}
                    <span className="text-xs font-medium">
                      {isScanning
                        ? (lang === 'sw' ? 'Inasoma...' : 'Scanning...')
                        : (lang === 'sw' ? 'Risiti' : 'Receipt')}
                    </span>
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleReceiptScan(file);
                e.target.value = '';
              }}
            />

            {/* BIG Amount Input */}
            <div className="flex items-baseline gap-2">
              <span className="text-white/80 text-lg font-medium">{symbol}</span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                className="flex-1 text-4xl font-black text-white bg-transparent outline-none placeholder-white/40"
                autoFocus
                aria-label={lang === 'sw' ? 'Kiasi (shilingi)' : 'Amount (shillings)'}
                min="1"
                max="99999999"
              />
            </div>
            {amountError && (
              <p className="text-xs text-red-200 mt-1 font-medium">⚠️ {amountError}</p>
            )}

            {/* Quick amount chips */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    amount === amt.toString() ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {amt >= 1_000_000
                    ? `${(amt / 1_000_000).toFixed(1)}M`
                    : amt >= 1000
                      ? `${amt / 1000}k`
                      : amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {showConsent && (
              <AiConsentNotice
                lang={lang}
                mode="full"
                onGrant={() => {
                  writeAiConsent(browserStorage(), 'granted');
                  setShowConsent(false);
                  fileInputRef.current?.click();
                }}
                onDeny={() => {
                  writeAiConsent(browserStorage(), 'denied');
                  setShowConsent(false);
                }}
                onReview={() => setShowConsent(true)}
              />
            )}
            {/* Smart suggestions */}
            {isExpense && smartSuggestions.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Zap size={14} color="var(--mk-orange)" />
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? 'Mapendekezo' : 'Suggestions'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {smartSuggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      onClick={() => handleQuickFill(s)}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12,
                        border: `2px solid ${category === s.category && amount === s.amount.toString() ? 'var(--mk-orange)' : 'var(--mk-border)'}`,
                        background: category === s.category && amount === s.amount.toString() ? 'rgba(var(--mk-orange-rgb),0.1)' : 'var(--mk-card)',
                        color: category === s.category && amount === s.amount.toString() ? 'var(--mk-orange)' : 'var(--mk-text)',
                        fontSize: 12, fontWeight: 600, fontFamily: 'Geist, sans-serif', cursor: 'pointer',
                      }}
                    >
                      <span>{getCategoryIcon(s.category)}</span>
                      <span>{s.category}</span>
                      <span style={{ color: '#4B5563' }}>·</span>
                      <span>{s.amount >= 1000 ? `${(s.amount / 1000).toFixed(0)}k` : s.amount}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-detected category banner */}
            <AnimatePresence>
              {autoDetected && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={applyAutoDetected}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(var(--mk-purple-rgb),0.1)', border: '2px solid rgba(var(--mk-purple-rgb),0.3)', borderRadius: 16, padding: '12px 16px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color="var(--mk-purple)" />
                    <span style={{ fontSize: 13, color: 'var(--mk-purple)', fontFamily: 'Geist, sans-serif', fontWeight: 600 }}>
                      {lang === 'sw' ? `Kutambua: ${autoDetected}` : `Detected: ${autoDetected}`}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--mk-purple)', fontWeight: 700, background: 'rgba(var(--mk-purple-rgb),0.2)', padding: '4px 10px', borderRadius: 999, fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? 'Tumia' : 'Apply'} {getCategoryIcon(autoDetected)}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Category Grid */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Geist, sans-serif' }}>
                {t('category', lang)}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {categories.map(cat => {
                  const selected = category === cat;
                  const selColor = isExpense ? 'var(--mk-red)' : 'var(--mk-green)';
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '10px 8px', borderRadius: 12,
                        border: `2px solid ${selected ? selColor : 'var(--mk-border)'}`,
                        background: selected ? (isExpense ? 'rgba(var(--mk-red-rgb),0.1)' : 'rgba(var(--mk-green-rgb),0.1)') : 'var(--mk-card)',
                        color: selected ? selColor : 'var(--mk-text-secondary)',
                        fontSize: 11, fontWeight: selected ? 700 : 500, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        fontFamily: 'Geist, sans-serif',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{getCategoryIcon(cat)}</span>
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Source */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Geist, sans-serif' }}>
                {t('paymentSource', lang)}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SOURCES.map(src => (
                  <button
                    key={src}
                    onClick={() => setSource(src)}
                    style={{
                      padding: '8px 14px', borderRadius: 12,
                      border: `2px solid ${source === src ? 'var(--mk-orange)' : 'var(--mk-border)'}`,
                      background: source === src ? 'rgba(var(--mk-orange-rgb),0.1)' : 'var(--mk-card)',
                      color: source === src ? 'var(--mk-orange)' : 'var(--mk-text-secondary)',
                      fontSize: 12, fontWeight: source === src ? 700 : 500, cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    {SOURCE_LABELS[src][lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
                {t('notes', lang)}
                <span style={{ marginLeft: 8, color: 'var(--mk-purple)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  {lang === 'sw' ? '(itatambua jamii otomatifu)' : '(auto-detects category)'}
                </span>
              </p>
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Mf: KFC, Daladala, Vodacom...' : 'e.g. KFC, Bus, Vodacom...'}
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                style={{ width: '100%', background: 'var(--mk-card)', border: '1.5px solid var(--mk-border)', color: 'var(--mk-text)', borderRadius: 12, padding: '12px 16px', fontSize: 14, outline: 'none', fontFamily: 'Geist, sans-serif', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = 'var(--mk-orange)')}
                onBlur={e => (e.target.style.borderColor = 'var(--mk-border)')}
              />
            </div>

            {/* Date picker */}
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const isToday = selectedDate === today;
              return (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw' ? 'Tarehe' : 'Date'}
                    {!isToday && (
                      <span style={{ marginLeft: 8, color: 'var(--mk-orange)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                        {lang === 'sw' ? '(tarehe ya nyuma)' : '(past date)'}
                      </span>
                    )}
                  </p>
                  <input
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ width: '100%', background: 'var(--mk-card)', border: '1.5px solid var(--mk-border)', color: 'var(--mk-text)', borderRadius: 12, padding: '12px 16px', fontSize: 14, outline: 'none', fontFamily: 'Geist, sans-serif', boxSizing: 'border-box', colorScheme: 'dark' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--mk-orange)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--mk-border)')}
                  />
                </div>
              );
            })()}

            {/* Round-up nudge */}
            {isExpense && state.roundUpEnabled && amount && parseFloat(amount) > 0 && (() => {
              const parsed = parseFloat(amount);
              const roundUp = Math.ceil(parsed / 500) * 500 - parsed;
              return roundUp > 0 && roundUp < 500 ? (
                <div style={{ background: 'rgba(var(--mk-green-rgb),0.08)', border: '1px solid rgba(var(--mk-green-rgb),0.2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🪙</span>
                  <p style={{ fontSize: 12, color: 'var(--mk-green)', fontFamily: 'Geist, sans-serif' }}>
                    {lang === 'sw'
                      ? `${symbol} ${roundUp.toLocaleString()} itaokolewa (round-up)`
                      : `${symbol} ${roundUp.toLocaleString()} will be saved (round-up)`}
                  </p>
                </div>
              ) : null;
            })()}

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!amount || !category}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 999, border: 'none',
                background: !amount || !category ? 'var(--mk-card)' : headerBg,
                color: !amount || !category ? '#4B5563' : 'var(--mk-text)',
                fontSize: 16, fontWeight: 700, cursor: !amount || !category ? 'not-allowed' : 'pointer',
                fontFamily: 'Geist, sans-serif', transition: 'all 0.2s',
                boxShadow: !amount || !category ? 'none' : (isExpense ? '0 0 20px rgba(var(--mk-red-rgb),0.3)' : '0 0 20px rgba(var(--mk-green-rgb),0.3)'),
              }}
            >
              {t('save', lang)} {amount && category ? `– ${symbol} ${parseFloat(amount || '0').toLocaleString()}` : ''}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}