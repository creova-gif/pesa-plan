import { useMemo } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '@/app/App';
import { formatCurrency } from '@/app/utils/currency';
import { getCategoryIcon } from '@/app/utils/categoryIcons';
import { detectRecurring } from '@/app/utils/recurringDetect';

function DueBadge({ daysUntil, lang }: { daysUntil: number; lang: string }) {
  if (daysUntil < 0) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
        background: '#FEE2E2', color: '#B91C1C', fontFamily: 'Geist, sans-serif',
      }}>
        {lang === 'sw' ? 'Imepita' : 'Overdue'}
      </span>
    );
  }
  if (daysUntil === 0) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
        background: '#FEE2E2', color: '#B91C1C', fontFamily: 'Geist, sans-serif',
      }}>
        {lang === 'sw' ? 'Leo!' : 'Today!'}
      </span>
    );
  }
  if (daysUntil <= 3) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
        background: '#FEF3C7', color: '#B45309', fontFamily: 'Geist, sans-serif',
      }}>
        {lang === 'sw' ? `Siku ${daysUntil}` : `${daysUntil}d`}
      </span>
    );
  }
  if (daysUntil <= 7) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
        background: '#FFF7ED', color: '#C2410C', fontFamily: 'Geist, sans-serif',
      }}>
        {lang === 'sw' ? `Siku ${daysUntil}` : `${daysUntil}d`}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
      background: '#F6F6F4', color: '#928F8B', fontFamily: 'Geist, sans-serif',
    }}>
      {lang === 'sw' ? `Siku ${daysUntil}` : `${daysUntil}d`}
    </span>
  );
}

export function SubscriptionTracker() {
  const { state } = useApp();
  const lang = state.language;
  const fmt = (n: number) => formatCurrency(n, state.region);

  const recurring = useMemo(() => detectRecurring(state.transactions), [state.transactions]);

  if (recurring.length === 0) return null;

  const urgentCount = recurring.filter(r => r.daysUntil <= 7).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1.5px solid #F4F4F2',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid #F4F4F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RefreshCw size={14} color="#15803D" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A3D2E', fontFamily: 'Geist, sans-serif', lineHeight: 1.2 }}>
              {lang === 'sw' ? 'Malipo ya Mara kwa Mara' : 'Recurring Bills'}
            </p>
            <p style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? `${recurring.length} zimetambuliwa` : `${recurring.length} detected`}
            </p>
          </div>
        </div>
        {urgentCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={13} color="#B45309" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', fontFamily: 'Geist, sans-serif' }}>
              {lang === 'sw' ? `${urgentCount} inakuja hivi karibuni` : `${urgentCount} due soon`}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 0' }}>
        {recurring.map((item, i) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              borderBottom: i < recurring.length - 1 ? '1px solid #F9F9F8' : 'none',
              background: item.daysUntil <= 3 ? 'rgba(254,243,199,0.3)' : 'transparent',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '1.5px solid #F4F4F2', background: '#FAFAF9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, flexShrink: 0,
            }}>
              {getCategoryIcon(item.category)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 500, color: '#4D4845',
                fontFamily: 'Geist, sans-serif', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.category}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Clock size={10} color="#A6A4A0" />
                <p style={{ fontSize: 11, color: '#928F8B', fontFamily: 'Geist, sans-serif' }}>
                  {item.nextDue.toLocaleDateString(lang === 'sw' ? 'sw' : 'en', { month: 'short', day: 'numeric' })}
                  {' · '}
                  {lang === 'sw' ? `${item.occurrences}× mwezi huu` : `${item.occurrences}× this period`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#C9362B', fontFamily: 'Geist, sans-serif' }}>
                ~{fmt(item.avgAmount)}
              </p>
              <DueBadge daysUntil={item.daysUntil} lang={lang} />
            </div>
          </motion.div>
        ))}
      </div>

      {urgentCount > 0 && (
        <div style={{
          padding: '10px 16px 14px',
          borderTop: '1px solid #F4F4F2',
          background: '#FFFBEB',
        }}>
          <p style={{ fontSize: 11, color: '#92400E', fontFamily: 'Geist, sans-serif', textAlign: 'center' }}>
            {lang === 'sw'
              ? '💡 Hakikisha una pesa za kutosha kwa malipo yanayokuja'
              : '💡 Ensure you have enough funds for upcoming payments'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
