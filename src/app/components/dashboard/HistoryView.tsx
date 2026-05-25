import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TrendingUp, TrendingDown, Filter, X, Trash2, Search, ChevronRight } from 'lucide-react';
import { useApp, type PaymentSource, type Transaction } from '@/app/App';
import { t } from '@/app/utils/translations';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { getBrandEntry } from '@/app/utils/brandLogos';
import { format } from 'date-fns';
import { formatCurrency as fmtCurrency } from '@/app/utils/currency';

interface HistoryViewProps {
  onBack: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

type FilterType = 'all' | 'income' | 'expense';
type FilterSource = PaymentSource | 'all';
type DateRange = 'all' | 'today' | 'week' | 'month';

const PAGE_SIZE = 25;

const SOURCE_ICONS: Record<string, string> = {
  cash: '💵', mpesa: '📲', airtel: '📶', tigo: '📡', bank: '🏦', loan: '💳',
};

export function HistoryView({ onBack, onEditTransaction }: HistoryViewProps) {
  const { state, deleteTransaction } = useApp();
  const lang = state.language;
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterDateRange, setFilterDateRange] = useState<DateRange>('all');
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartRef = useRef<number>(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => fmtCurrency(amount, state.region);

  const dateRangeStart = (() => {
    const now = new Date();
    if (filterDateRange === 'today') {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    if (filterDateRange === 'week') {
      const d = new Date(now); d.setDate(now.getDate() - now.getDay()); d.setHours(0, 0, 0, 0); return d;
    }
    if (filterDateRange === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return null;
  })();

  const filteredTransactions = state.transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterSource !== 'all' && tx.source !== filterSource) return false;
    if (dateRangeStart && tx.date < dateRangeStart) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = [tx.category, tx.notes ?? '', tx.source, tx.type].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const isFiltered = filterType !== 'all' || filterSource !== 'all' || filterDateRange !== 'all' || searchQuery.trim().length > 0;

  const netSummary = filteredTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const net = netSummary.income - netSummary.expense;

  const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = format(transaction.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, typeof filteredTransactions>);

  const allSortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  let shownSoFar = 0;
  const sortedDates = allSortedDates.filter(dateKey => {
    if (shownSoFar >= visibleCount) return false;
    shownSoFar += groupedTransactions[dateKey].length;
    return true;
  });

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return t('today', lang);
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return t('yesterday', lang);
    return format(date, 'MMM dd, yyyy');
  };

  const typeOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: t('all', lang) },
    { value: 'income', label: t('income', lang) },
    { value: 'expense', label: t('expense', lang) },
  ];

  const sourceOptions: { value: FilterSource; label: string }[] = [
    { value: 'all', label: t('all', lang) },
    { value: 'cash', label: t('cash', lang) },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'airtel', label: 'Airtel' },
    { value: 'tigo', label: 'Tigo' },
    { value: 'bank', label: t('bank', lang) },
  ];

  const onTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent, tx: Transaction) => {
    const delta = e.changedTouches[0].clientX - touchStartRef.current;
    if (delta < -70) {
      setSwipedId(tx.id);
    } else if (delta > 70) {
      onEditTransaction?.(tx);
      setSwipedId(null);
    } else if (Math.abs(delta) < 10) {
      if (swipedId === tx.id) setSwipedId(null);
      else setDetailTx(tx);
    }
  };

  const handleDeleteTx = (txId: string) => {
    if (confirmDeleteId === txId) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      deleteTransaction(txId);
      setSwipedId(null);
      setConfirmDeleteId(null);
      if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    } else {
      setConfirmDeleteId(txId);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const getDayTotals = (txs: Transaction[]) => {
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--mk-bg)' }}>
      {/* Header */}
      <div className="text-white px-6 pb-5 min-safe-top" style={{ background: 'linear-gradient(160deg, #1a0800 0%, var(--mk-orange) 100%)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">{t('history', lang)}</h1>
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${
              isFiltered ? 'bg-[var(--mk-card)] text-green-700' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{t('filter', lang)}</span>
            {isFiltered && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--mk-green)' }} />}
          </button>
        </div>
        <p className="text-sm opacity-80 ml-14">
          {filteredTransactions.length} {lang === 'sw' ? 'miamala' : 'transactions'}
          {isFiltered && ` (${t('filtered', lang)})`}
        </p>
      </div>

      {/* Date range + search sticky bar */}
      <div className="bg-[var(--mk-card)] border-b border-[var(--mk-border)] sticky top-0 z-10 shadow-sm">
        {/* Date chips */}
        <div className="px-4 pt-2.5 pb-0 flex gap-2 overflow-x-auto">
          {([
            { value: 'all', sw: 'Zote', en: 'All time' },
            { value: 'today', sw: 'Leo', en: 'Today' },
            { value: 'week', sw: 'Wiki hii', en: 'This week' },
            { value: 'month', sw: 'Mwezi huu', en: 'This month' },
          ] as { value: DateRange; sw: string; en: string }[]).map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterDateRange(opt.value); setVisibleCount(PAGE_SIZE); }}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filterDateRange === opt.value
                  ? 'text-white'
                  : 'text-[var(--mk-text-secondary)] hover:bg-[var(--mk-border)]'
              }`}
            style={filterDateRange === opt.value ? { background: 'var(--mk-green)' } : { background: 'var(--mk-border)' }}
            >
              {lang === 'sw' ? opt.sw : opt.en}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="px-4 py-2.5">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border-2 transition-colors ${
            searchFocused ? 'bg-[var(--mk-card)]' : 'bg-[var(--mk-border)]'
          }`} style={{ borderColor: searchFocused ? 'var(--mk-green)' : 'transparent' }}>
            <Search className="w-4 h-4 text-[var(--mk-text-secondary)] shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={lang === 'sw' ? 'Tafuta muamala...' : 'Search transactions...'}
              className="flex-1 text-sm bg-transparent outline-none text-[var(--mk-text-secondary)] placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5">
                <X className="w-3.5 h-3.5 text-[var(--mk-text-secondary)]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Net summary bar */}
      {filteredTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 bg-[var(--mk-card)] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--mk-border)' }}
        >
          <div className="grid grid-cols-3 divide-x divide-[var(--mk-border)]">
            <div className="px-3 py-3 text-center">
              <p className="text-[10px] text-[var(--mk-text-secondary)] mb-0.5">{t('income', lang)}</p>
              <p className="text-sm font-bold text-emerald-600">+{formatCurrency(netSummary.income)}</p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-[10px] text-[var(--mk-text-secondary)] mb-0.5">{t('expense', lang)}</p>
              <p className="text-sm font-bold text-red-500">-{formatCurrency(netSummary.expense)}</p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-[10px] text-[var(--mk-text-secondary)] mb-0.5">{lang === 'sw' ? 'Jumla' : 'Net'}</p>
              <p className={`text-sm font-bold ${net >= 0 ? 'text-blue-600' : 'text-green-600'}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Swipe hint */}
      {filteredTransactions.length > 0 && (
        <p className="text-xs text-[var(--mk-text-secondary)] text-center py-2">
          {lang === 'sw' ? '← Buruta kufuta · Bonyeza kuona maelezo' : '← Swipe to delete · Tap for details'}
        </p>
      )}

      <div className="px-4 py-2">
        {filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--mk-card)] rounded-2xl p-10 shadow-md text-center mt-4"
          >
            <p className="text-4xl mb-3">{searchQuery ? '🔍' : '📭'}</p>
            <p className="text-[var(--mk-text-secondary)] font-medium">
              {searchQuery
                ? (lang === 'sw' ? `Hakuna matokeo ya "${searchQuery}"` : `No results for "${searchQuery}"`)
                : isFiltered ? t('noTransactionsFilter', lang) : t('noTransactionsYet', lang)}
            </p>
            {isFiltered && (
              <button
                onClick={() => { setFilterType('all'); setFilterSource('all'); setFilterDateRange('all'); setSearchQuery(''); }}
                className="mt-3 text-sm text-green-600 font-medium"
              >
                {t('clearFilters', lang)}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4 mt-2">
            {sortedDates.map((dateKey) => {
              const txs = groupedTransactions[dateKey];
              const { income, expense } = getDayTotals(txs);
              return (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-sm font-bold text-[var(--mk-text-secondary)]">{getDateLabel(dateKey)}</span>
                    <div className="flex items-center gap-2 text-xs">
                      {income > 0 && <span className="text-emerald-600 font-semibold">+{formatCurrency(income)}</span>}
                      {expense > 0 && <span className="text-red-500 font-semibold">-{formatCurrency(expense)}</span>}
                    </div>
                  </div>

                  <div className="bg-[var(--mk-card)] rounded-2xl overflow-hidden">
                    {txs.map((transaction, index) => (
                      <div key={transaction.id} className="relative overflow-hidden">
                        {/* Swipe-revealed buttons */}
                        <AnimatePresence>
                          {swipedId === transaction.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute right-0 top-0 h-full flex"
                            >
                              <button
                                onClick={() => handleDeleteTx(transaction.id)}
                                className={`text-white px-5 h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                                  confirmDeleteId === transaction.id ? 'bg-red-700' : 'bg-red-500'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs font-semibold">
                                  {confirmDeleteId === transaction.id ? t('confirm', lang) : t('delete', lang)}
                                </span>
                              </button>
                              <button
                                onClick={() => { onEditTransaction?.(transaction); setSwipedId(null); }}
                                className="bg-blue-500 text-white px-4 h-full flex flex-col items-center justify-center gap-0.5"
                              >
                                <span className="text-lg leading-none">✏️</span>
                                <span className="text-xs font-semibold">{t('edit', lang)}</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div
                          animate={{ x: swipedId === transaction.id ? -116 : 0 }}
                          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                          onTouchStart={e => onTouchStart(e, transaction.id)}
                          onTouchEnd={e => onTouchEnd(e, transaction)}
                          initial={{ opacity: 0, x: -20 }}
                          className={`flex items-center justify-between p-4 bg-[var(--mk-card)] cursor-pointer active:bg-[var(--mk-bg-alt)] ${
                            index < txs.length - 1 ? 'border-b border-[var(--mk-border)]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const brand = getBrandEntry(transaction.category, transaction.notes);
                              if (brand) {
                                const Icon = brand.component;
                                return (
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                                    style={{ background: brand.bg }}>
                                    <Icon width={22} height={22} />
                                  </div>
                                );
                              }
                              return (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                                  transaction.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                                }`}>
                                  <span>{getCategoryIcon(transaction.category)}</span>
                                </div>
                              );
                            })()}
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--mk-text)] text-sm truncate">{transaction.category}</p>
                              <p className="text-xs text-[var(--mk-text-secondary)]">
                                {SOURCE_ICONS[transaction.source] ?? '💰'} {transaction.source.toUpperCase()}
                                {transaction.notes ? ` · ${transaction.notes}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <div className="text-right">
                              <p className={`font-bold text-sm ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-xs text-[var(--mk-text-secondary)]">{format(transaction.date, 'HH:mm')}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--mk-text-secondary)] shrink-0" />
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {filteredTransactions.length > visibleCount && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="w-full py-3.5 bg-[var(--mk-card)] border-2 border-[var(--mk-border)] rounded-2xl text-sm font-semibold text-[var(--mk-text-secondary)] hover:border-green-400 hover:text-green-600 transition shadow-sm"
              >
                {lang === 'sw'
                  ? `Pakia zaidi (${filteredTransactions.length - visibleCount} zimebaki)`
                  : `Load more (${filteredTransactions.length - visibleCount} remaining)`}
              </motion.button>
            )}

            {filteredTransactions.length <= visibleCount && filteredTransactions.length > 0 && (
              <p className="text-center text-xs text-[var(--mk-text-secondary)] py-2">
                {t('endOfHistory', lang)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Filter Sheet ── */}
      <AnimatePresence>
        {showFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowFilter(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--mk-card)] rounded-t-3xl z-50 border-t border-[var(--mk-border)] p-6 pb-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-[var(--mk-border)] rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--mk-text)]">{t('filter', lang)}</h3>
                <button onClick={() => setShowFilter(false)} className="p-2 hover:bg-[var(--mk-border)] rounded-full">
                  <X className="w-5 h-5 text-[var(--mk-text-secondary)]" />
                </button>
              </div>

              <div className="mb-5">
                <p className="text-sm font-semibold text-[var(--mk-text-secondary)] mb-2">{t('type', lang)}</p>
                <div className="flex gap-2">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterType(opt.value)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                        filterType === opt.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-[var(--mk-border)] text-[var(--mk-text-secondary)] hover:border-[var(--mk-border)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-[var(--mk-text-secondary)] mb-2">{t('source', lang)}</p>
                <div className="flex gap-2 flex-wrap">
                  {sourceOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterSource(opt.value)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
                        filterSource === opt.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-[var(--mk-border)] text-[var(--mk-text-secondary)] hover:border-[var(--mk-border)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setFilterType('all'); setFilterSource('all'); }}
                  className="flex-1 py-3.5 border-2 border-[var(--mk-border)] rounded-2xl text-[var(--mk-text-secondary)] font-medium text-sm"
                >
                  {t('clearAll', lang)}
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm" style={{ background: 'var(--mk-green)' }}
                >
                  {t('showResults', lang)}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Transaction Detail Sheet ── */}
      <AnimatePresence>
        {detailTx && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setDetailTx(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--mk-card)] rounded-t-3xl z-50 border-t border-[var(--mk-border)] pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-[var(--mk-border)] rounded-full mx-auto mt-4 mb-1" />

              {/* Colored accent bar */}
              <div className={`mx-5 mt-4 rounded-2xl p-5 ${
                detailTx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                    detailTx.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {getCategoryIcon(detailTx.category)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--mk-text-secondary)] uppercase tracking-wide">
                      {detailTx.category}
                    </p>
                    <p className={`text-3xl font-black ${
                      detailTx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {detailTx.type === 'income' ? '+' : '-'}{formatCurrency(detailTx.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-5 mt-5 space-y-3">
                {[
                  {
                    icon: '📅',
                    label: lang === 'sw' ? 'Tarehe' : 'Date',
                    value: format(detailTx.date, 'EEEE, MMM dd yyyy'),
                  },
                  {
                    icon: '🕐',
                    label: lang === 'sw' ? 'Muda' : 'Time',
                    value: format(detailTx.date, 'HH:mm'),
                  },
                  {
                    icon: SOURCE_ICONS[detailTx.source] ?? '💰',
                    label: lang === 'sw' ? 'Chanzo' : 'Source',
                    value: detailTx.source.toUpperCase(),
                  },
                  {
                    icon: '🏷️',
                    label: lang === 'sw' ? 'Aina' : 'Type',
                    value: detailTx.type === 'income'
                      ? (lang === 'sw' ? 'Mapato' : 'Income')
                      : (lang === 'sw' ? 'Matumizi' : 'Expense'),
                  },
                  ...(detailTx.notes ? [{
                    icon: '📝',
                    label: lang === 'sw' ? 'Maelezo' : 'Notes',
                    value: detailTx.notes,
                  }] : []),
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 bg-[var(--mk-bg-alt)] rounded-xl px-4 py-3">
                    <span className="text-lg shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--mk-text-secondary)]">{label}</p>
                      <p className="text-sm font-semibold text-[var(--mk-text)] truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-5 mt-5 flex gap-3">
                <button
                  onClick={() => {
                    setDetailTx(null);
                    onEditTransaction?.(detailTx);
                  }}
                  className="flex-1 py-3.5 bg-blue-500 text-white rounded-2xl font-bold text-sm"
                >
                  ✏️ {t('edit', lang)}
                </button>
                <button
                  onClick={() => {
                    deleteTransaction(detailTx.id);
                    setDetailTx(null);
                    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
                  }}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm"
                >
                  🗑️ {t('delete', lang)}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
