import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Sparkles, Camera, Loader2 } from 'lucide-react';
import { useApp, type TransactionType, type PaymentSource } from '@/app/App';
import { t } from '@/app/utils/translations';
import { toast } from 'sonner';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { REGION_CONFIG, type Region } from '@/app/utils/currency';

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

  const handleReceiptScan = async (file: File) => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      toast.error(lang === 'sw' ? 'Huduma ya skanning haipo. Weka VITE_ANTHROPIC_API_KEY.' : 'Receipt scanning unavailable. Set VITE_ANTHROPIC_API_KEY.');
      return;
    }
    setIsScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const mediaType = (file.type === 'image/png' ? 'image/png' : file.type === 'image/gif' ? 'image/gif' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Extract from this receipt: total amount (number, no currency symbols), merchant or item description (short), date in YYYY-MM-DD format. Reply ONLY with valid JSON: {"amount": 1234, "notes": "KFC Mlimani", "date": "2024-01-15"}. If this is not a receipt, reply {"error": "not a receipt"}.' },
          ],
        }],
      });

      const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const match = text.match(/\{[\s\S]*?\}/);
      if (!match) throw new Error('No JSON in response');
      const parsed = JSON.parse(match[0]);

      if (parsed.error) {
        toast.error(lang === 'sw' ? 'Picha si risiti — jaribu tena' : 'Image is not a receipt — try again');
        return;
      }

      if (parsed.amount && !isNaN(Number(parsed.amount))) {
        setAmount(String(Math.round(Number(parsed.amount))));
      }
      if (parsed.notes) {
        setNotes(parsed.notes);
        const detected = autoDetectCategory(parsed.notes, lang);
        if (detected) setCategory(detected);
      }
      if (parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
        const today = new Date().toISOString().split('T')[0];
        if (parsed.date <= today) setSelectedDate(parsed.date);
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
  const headerBg = isExpense ? '#b91c1c' : '#15803d';

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
          className="bg-white w-full rounded-t-3xl max-h-[92vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Colored header */}
          <div className="text-white px-5 pt-5 pb-6 rounded-t-3xl" style={{ background: headerBg }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">
                {isExpense ? t('addExpense', lang) : t('addIncome', lang)}
              </h2>
              <div className="flex items-center gap-2">
                {isExpense && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
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

          <div className="px-5 py-4 space-y-5">
            {/* Smart suggestions */}
            {isExpense && smartSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {lang === 'sw' ? 'Mapendekezo' : 'Suggestions'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {smartSuggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      onClick={() => handleQuickFill(s)}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition ${
                        category === s.category && amount === s.amount.toString()
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 hover:border-emerald-300 text-gray-700'
                      }`}
                    >
                      <span>{getCategoryIcon(s.category)}</span>
                      <span>{s.category}</span>
                      <span className="text-gray-400">·</span>
                      <span>{s.amount >= 1000 ? `${(s.amount / 1000).toFixed(0)}k` : s.amount}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Feature 1: Auto-detected category banner */}
            <AnimatePresence>
              {autoDetected && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={applyAutoDetected}
                  className="w-full flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-800">
                      {lang === 'sw' ? `Kutambua: ${autoDetected}` : `Detected: ${autoDetected}`}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                    {lang === 'sw' ? 'Tumia' : 'Apply'} {getCategoryIcon(autoDetected)}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Category Grid with icons */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('category', lang)}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`py-2.5 px-2 rounded-xl border-2 text-xs font-medium transition flex flex-col items-center gap-0.5 ${
                      category === cat
                        ? isExpense
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">{getCategoryIcon(cat)}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Source */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('paymentSource', lang)}
              </label>
              <div className="flex gap-2 flex-wrap">
                {SOURCES.map(src => (
                  <button
                    key={src}
                    onClick={() => setSource(src)}
                    className={`py-2 px-3.5 rounded-xl border-2 text-xs font-medium transition ${
                      source === src
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {SOURCE_LABELS[src][lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes with auto-categorization hint */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('notes', lang)}
                <span className="ml-2 text-blue-400 normal-case font-normal">
                  {lang === 'sw' ? '(itatambua jamii otomatifu)' : '(auto-detects category)'}
                </span>
              </label>
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Mf: KFC, Daladala, Vodacom...' : 'e.g. KFC, Bus, Vodacom...'}
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 transition"
              />
            </div>

            {/* Date picker — allow logging past transactions */}
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const isToday = selectedDate === today;
              return (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {lang === 'sw' ? 'Tarehe' : 'Date'}
                    {!isToday && (
                      <span className="ml-2 text-amber-500 normal-case font-normal">
                        {lang === 'sw' ? '(tarehe ya nyuma)' : '(past date)'}
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                  />
                </div>
              );
            })()}

            {/* Round-up savings nudge */}
            {isExpense && state.roundUpEnabled && amount && parseFloat(amount) > 0 && (() => {
              const parsed = parseFloat(amount);
              const roundUp = Math.ceil(parsed / 500) * 500 - parsed;
              return roundUp > 0 && roundUp < 500 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">🪙</span>
                  <p className="text-xs text-emerald-800">
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
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: !amount || !category ? '#9ca3af' : headerBg }}
            >
              {t('save', lang)} {amount && category ? `– ${symbol} ${parseFloat(amount || '0').toLocaleString()}` : ''}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}