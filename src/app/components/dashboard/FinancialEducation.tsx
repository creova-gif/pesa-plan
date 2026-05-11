import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle, ChevronRight, X, Clock, Star } from 'lucide-react';
import { useApp } from '@/app/App';

/** Roadmap Feature 6 — Financial Education Layer */

interface Lesson {
  id: string;
  emoji: string;
  title: { sw: string; en: string };
  subtitle: { sw: string; en: string };
  readTime: number; // minutes
  difficulty: 'beginner' | 'intermediate';
  points: { sw: string; en: string }[];
  action?: { sw: string; en: string };
  color: string;
  bg: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'rule-50-30-20',
    emoji: '🧮',
    title: { sw: 'Kanuni ya 50-30-20', en: '50-30-20 Rule' },
    subtitle: { sw: 'Gawanya mapato yako kwa uhalisi', en: 'Split your income wisely' },
    readTime: 3,
    difficulty: 'beginner',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    points: [
      { sw: '50% kwa mahitaji ya lazima (chakula, kodi, usafiri)', en: '50% for needs (food, rent, transport)' },
      { sw: '30% kwa matakwa (starehe, mavazi ya ziada)', en: '30% for wants (entertainment, extras)' },
      { sw: '20% kwa akiba na deni', en: '20% for savings & debt repayment' },
    ],
    action: { sw: 'Weka bajeti sasa', en: 'Set budgets now' },
  },
  {
    id: 'emergency-fund',
    emoji: '🏦',
    title: { sw: 'Mfuko wa Dharura', en: 'Emergency Fund' },
    subtitle: { sw: 'Usalama wako wa fedha', en: 'Your financial safety net' },
    readTime: 4,
    difficulty: 'beginner',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    points: [
      { sw: 'Hifadhi matumizi ya miezi 3–6 kama akiba ya dharura', en: 'Save 3–6 months of expenses as emergency reserve' },
      { sw: 'Iweke kwenye akaunti tofauti (M-Pesa savings au benki)', en: 'Keep it separate — M-Pesa savings or bank account' },
      { sw: 'Anza na TSh 50,000 na uongeze kidogo kila mwezi', en: 'Start with TSh 50,000 and add a little each month' },
    ],
  },
  {
    id: 'pay-yourself-first',
    emoji: '🧠',
    title: { sw: 'Jilipe Mwenyewe Kwanza', en: 'Pay Yourself First' },
    subtitle: { sw: 'Siri ya watu wanaookoa', en: 'The secret of consistent savers' },
    readTime: 3,
    difficulty: 'beginner',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    points: [
      { sw: 'Unapopata pesa, ongeza akiba KABLA ya kutumia', en: 'When income arrives, save FIRST before spending' },
      { sw: 'Hata TSh 2,000–5,000 kwa siku inaweza kuwa TSh 60,000–150,000 kwa mwezi', en: 'Even TSh 2,000–5,000/day = TSh 60–150K/month' },
      { sw: 'Tumia Maokoto Goals kufuatilia akiba yako', en: 'Use Maokoto Goals to track your savings' },
    ],
  },
  {
    id: 'mpesa-tips',
    emoji: '📱',
    title: { sw: 'Vidokezo vya M-Pesa', en: 'M-Pesa Money Tips' },
    subtitle: { sw: 'Tumia M-Pesa vizuri zaidi', en: 'Make the most of mobile money' },
    readTime: 4,
    difficulty: 'beginner',
    color: 'text-green-700',
    bg: 'bg-green-50',
    points: [
      { sw: 'M-Pesa Mali inakupa riba ya 6-7% kwa mwaka — bora kuliko kutunza nyumbani', en: 'M-Pesa Mali earns 6-7% interest — better than keeping cash at home' },
      { sw: 'Panga malipo ya mara kwa mara (kodi, LUKU) kuepuka faini', en: 'Schedule recurring payments (rent, LUKU) to avoid late fees' },
      { sw: 'Tumia M-Pesa statement kujua unatumia pesa wapi', en: 'Check M-Pesa statement monthly to track spending' },
    ],
  },
  {
    id: 'debt-awareness',
    emoji: '💳',
    title: { sw: 'Uelewa wa Madeni', en: 'Debt Awareness' },
    subtitle: { sw: 'Lipa madeni ya haraka kwanza', en: 'Prioritise high-interest debt' },
    readTime: 5,
    difficulty: 'intermediate',
    color: 'text-red-600',
    bg: 'bg-red-50',
    points: [
      { sw: 'Deni la riba kubwa (mfano 30%/mwaka) hukuibia zaidi ya akiba yako inavyokua', en: 'High-interest debt (e.g. 30%/yr) costs more than savings earn' },
      { sw: 'Lipa deni la riba kubwa kwanza kabla ya kufungua akiba mpya', en: 'Pay high-interest debt before opening new savings' },
      { sw: 'Epuka kukopa kwa ajili ya matumizi ya kila siku — tumia akiba badala yake', en: 'Avoid borrowing for daily spending — use savings instead' },
    ],
  },
  {
    id: 'invest-basics',
    emoji: '🌱',
    title: { sw: 'Misingi ya Uwekezaji', en: 'Investment Basics' },
    subtitle: { sw: 'Pesa yako ifanye kazi', en: 'Make your money work' },
    readTime: 6,
    difficulty: 'intermediate',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    points: [
      { sw: 'Hazina ya Tanzania (T-Bills) inakupa ~8-10% kwa mwaka — chaguo salama', en: 'Tanzania Treasury Bills give ~8-10%/yr — safe option' },
      { sw: 'Anza na akiba, kisha fikiria uwekezaji baada ya mfuko wa dharura kuwa tayari', en: 'Start with savings, then invest after emergency fund is ready' },
      { sw: 'DHAMANA ZA SERIKALI zinapatikana kwa TSh 100,000 kupitia Benki ya CRDB', en: 'Government bonds available from TSh 100,000 via CRDB Bank' },
    ],
  },
];

export function FinancialEducation() {
  const { state, completeLesson } = useApp();
  const lang = state.language;
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setOpenLesson((e as CustomEvent<string>).detail);
    window.addEventListener('maokoto:open-lesson', handler);
    return () => window.removeEventListener('maokoto:open-lesson', handler);
  }, []);

  const completedCount = state.lessonProgress?.length ?? 0;
  const totalCount = LESSONS.length;
  const allDone = completedCount >= totalCount;

  const lesson = LESSONS.find(l => l.id === openLesson);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-1.5 rounded-full">
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {lang === 'sw' ? '📚 Elimu ya Fedha' : '📚 Financial Education'}
              </p>
              <p className="text-xs text-gray-400">
                {completedCount}/{totalCount} {lang === 'sw' ? 'masomo' : 'lessons'}
                {allDone && ' 🏆'}
              </p>
            </div>
          </div>
          {/* Progress ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="#f59e0b" strokeWidth="3"
                strokeDasharray={`${(completedCount / totalCount) * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-600">
              {Math.round((completedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>

        {/* Badge if all done */}
        {allDone && (
          <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold text-amber-800">
              {lang === 'sw' ? '🏆 Umemaliza kozi yote! Hongera!' : '🏆 You completed all lessons! Amazing!'}
            </p>
          </div>
        )}

        {/* Lesson list */}
        <div className="divide-y divide-gray-50">
          {LESSONS.map((l, i) => {
            const done = state.lessonProgress?.includes(l.id);
            return (
              <motion.button
                key={l.id}
                onClick={() => setOpenLesson(l.id)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
              >
                <div className={`w-10 h-10 rounded-full ${l.bg} flex items-center justify-center text-lg shrink-0`}>
                  {done ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : l.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${done ? 'text-gray-400' : 'text-gray-900'}`}>
                    {l.title[lang]}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{l.subtitle[lang]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      l.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {l.difficulty === 'beginner' ? (lang === 'sw' ? 'Rahisi' : 'Beginner') : (lang === 'sw' ? 'Kati' : 'Intermediate')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-gray-300" />
                  <span className="text-xs text-gray-300">{l.readTime}m</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Lesson Detail Sheet */}
      <AnimatePresence>
        {lesson && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setOpenLesson(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-5 pb-8 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

              {/* Lesson header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${lesson.bg} flex items-center justify-center text-2xl shrink-0`}>
                    {lesson.emoji}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{lesson.title[lang]}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{lesson.readTime} min read</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {lesson.difficulty === 'beginner' ? (lang === 'sw' ? 'Rahisi' : 'Beginner') : (lang === 'sw' ? 'Kati' : 'Intermediate')}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpenLesson(null)} className="p-1.5 bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className={`text-sm font-medium ${lesson.color} mb-5`}>{lesson.subtitle[lang]}</p>

              {/* Key points */}
              <div className="space-y-3 mb-6">
                {lesson.points.map((pt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-start gap-3 p-3 ${lesson.bg} rounded-xl`}
                  >
                    <span className={`text-sm font-black ${lesson.color} shrink-0 mt-0.5`}>{i + 1}.</span>
                    <p className="text-sm text-gray-800">{pt[lang]}</p>
                  </motion.div>
                ))}
              </div>

              {/* Complete button */}
              {state.lessonProgress?.includes(lesson.id) ? (
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-2xl">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700">
                    {lang === 'sw' ? 'Umekwishasoma somo hili!' : 'Lesson completed!'}
                  </p>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { completeLesson(lesson.id); setOpenLesson(null); }}
                  className={`w-full py-4 rounded-2xl text-white font-bold text-sm bg-gradient-to-r ${
                    lesson.difficulty === 'beginner'
                      ? 'from-emerald-500 to-emerald-600'
                      : 'from-orange-500 to-orange-600'
                  }`}
                >
                  ✅ {lang === 'sw' ? 'Nimesoma — Kumbuka Alama!' : 'Mark as Read — Earn Points!'}
                </motion.button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}