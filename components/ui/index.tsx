import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MK } from '@/lib/theme';

// ── MkCard ────────────────────────────────────────────────────────────────
export function MkCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────
export function Pill({
  label,
  onPress,
  active,
  color,
}: {
  label: string;
  onPress?: () => void;
  active?: boolean;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.pill,
        active
          ? { backgroundColor: color || MK.textPrimary }
          : { backgroundColor: MK.fillSecondary },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? '#fff' : MK.textPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────
export function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
    </View>
  );
}

// ── StripeProgressBar ─────────────────────────────────────────────────────
export function StripeProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  const over = value > max;
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${pct}%` as any,
            backgroundColor: over ? MK.fillOrangeAlt : MK.fillOrange,
          },
        ]}
      />
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: MK.radius,
    borderWidth: 1,
    borderColor: MK.border,
  },
  pill: {
    borderRadius: MK.radiusPill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: MK.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: MK.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: MK.radiusPill,
    backgroundColor: MK.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: MK.radiusPill,
  },
  divider: {
    height: 1,
    backgroundColor: MK.border,
  },
});
