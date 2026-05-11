import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { MkCard, StripeProgressBar, Divider, SectionHeader } from '@/components/ui';

const LESSONS = [
  { id: 'budget101', title: 'Budgeting 101', emoji: '📊', desc: 'Master the 50/30/20 rule', mins: 3 },
  { id: 'emergency', title: 'Emergency Fund', emoji: '🛡️', desc: 'Why you need 3-6 months saved', mins: 4 },
  { id: 'mpesa', title: 'M-Pesa & Mobile Money', emoji: '📱', desc: 'Maximise your mobile wallet', mins: 3 },
  { id: 'invest101', title: 'Investing Basics', emoji: '📈', desc: 'Start growing your wealth today', mins: 5 },
  { id: 'debt', title: 'Managing Debt', emoji: '💳', desc: 'Pay off loans the smart way', mins: 4 },
];

function HealthBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100));
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.healthLabel}>{label}</Text>
        <Text style={[styles.healthPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.healthTrack}>
        <View style={[styles.healthFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function InvestTab() {
  const { state, completeLesson } = useApp();

  const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;
  const netWorth = totalBalance - state.loanBalance;

  const expenses = state.transactions.filter(t => t.type === 'expense');
  const income = state.transactions.filter(t => t.type === 'income');
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Spending heatmap — last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const spent = state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date).toDateString() === dayStr)
      .reduce((s, t) => s + t.amount, 0);
    return { label: d.toLocaleDateString('en', { weekday: 'short' }), spent };
  });
  const maxDay = Math.max(...days.map(d => d.spent), 1);

  // Financial health score
  const healthScore = Math.min(100, Math.max(0,
    (savingsRate > 0 ? 25 : 0) +
    (state.streak > 7 ? 25 : state.streak > 3 ? 15 : 5) +
    (state.goals.length > 0 ? 25 : 0) +
    (state.loanBalance === 0 ? 25 : state.loanBalance < totalIncome ? 15 : 5)
  ));

  const scoreLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs work';
  const scoreColor = healthScore >= 80 ? MK.fillGreen : healthScore >= 60 ? MK.fillOrange : '#C9362B';

  // Top expense categories
  const catSpending = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCats = Object.entries(catSpending).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Net Worth */}
        <View style={styles.networthCard}>
          <Text style={styles.networthLabel}>Net Worth</Text>
          <View style={styles.networthRow}>
            <Text style={styles.networthValue}>{formatCurrency(netWorth, state.region)}</Text>
            {netWorth >= 0
              ? <TrendingUp size={22} color="rgba(255,255,255,0.8)" />
              : <TrendingDown size={22} color="rgba(255,255,255,0.8)" />
            }
          </View>
          <Text style={styles.networthSub}>
            Assets {formatCurrency(totalBalance, state.region)} · Loans {formatCurrency(state.loanBalance, state.region)}
          </Text>
        </View>

        {/* Financial Health Score */}
        <MkCard style={styles.healthCard}>
          <View style={styles.healthTop}>
            <Text style={styles.healthTitle}>Financial Health</Text>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{healthScore} · {scoreLabel}</Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            <HealthBar label="Savings rate" value={Math.max(savingsRate, 0)} max={100} color={MK.fillGreen} />
            <HealthBar label="Streak" value={state.streak} max={30} color={MK.fillOrange} />
            <HealthBar label="Goals progress" value={state.goals.length} max={5} color='#6366F1' />
          </View>
        </MkCard>

        {/* Spending Heatmap */}
        <View style={styles.section}>
          <SectionHeader label="Last 7 days" sub="daily spending" />
          <MkCard style={styles.heatmapCard}>
            <View style={styles.heatmapRow}>
              {days.map((d, i) => {
                const h = (d.spent / maxDay) * 100;
                return (
                  <View key={i} style={styles.heatmapCol}>
                    <View style={styles.heatmapBarTrack}>
                      <View style={[styles.heatmapBarFill, { height: `${Math.max(h, 4)}%` as any, backgroundColor: h > 70 ? '#C9362B' : h > 40 ? MK.fillOrange : MK.fillGreen }]} />
                    </View>
                    <Text style={styles.heatmapLabel}>{d.label[0]}</Text>
                  </View>
                );
              })}
            </View>
          </MkCard>
        </View>

        {/* Top Spending */}
        {topCats.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Top spending" />
            <MkCard>
              {topCats.map(([cat, amt], i) => (
                <View key={cat}>
                  {i > 0 && <Divider />}
                  <View style={styles.catRow}>
                    <View style={styles.catIcon}>
                      <Text style={styles.catEmoji}>{getCategoryIcon(cat)}</Text>
                    </View>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={[styles.catAmt, { color: MK.textExpense }]}>{formatCurrency(amt, state.region)}</Text>
                  </View>
                </View>
              ))}
            </MkCard>
          </View>
        )}

        {/* Savings Rate */}
        <MkCard style={styles.rateCard}>
          <Text style={styles.rateLabel}>Savings Rate</Text>
          <Text style={[styles.rateValue, { color: savingsRate >= 20 ? MK.fillGreen : savingsRate > 0 ? MK.fillOrange : MK.textExpense }]}>
            {savingsRate}%
          </Text>
          <Text style={styles.rateSub}>
            {savingsRate >= 20 ? 'Great! You\'re saving a healthy portion.' : savingsRate > 0 ? 'Aim for 20%+ savings.' : 'Start setting aside some income.'}
          </Text>
        </MkCard>

        {/* Financial Education */}
        <View style={styles.section}>
          <SectionHeader label="Learn" sub="financial education" />
          <View style={{ gap: 8 }}>
            {LESSONS.map(lesson => {
              const done = state.lessonProgress.includes(lesson.id);
              return (
                <MkCard key={lesson.id} style={styles.lessonCard}>
                  <View style={styles.lessonRow}>
                    <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lessonTitle, done && { color: MK.textSecondary }]}>{lesson.title}</Text>
                      <Text style={styles.lessonDesc}>{lesson.desc}</Text>
                    </View>
                    <View style={styles.lessonMeta}>
                      {done
                        ? <Text style={styles.doneText}>Done ✓</Text>
                        : <>
                            <BookOpen size={13} color={MK.textSecondary} />
                            <Text style={styles.minText}>{lesson.mins}m</Text>
                          </>
                      }
                    </View>
                  </View>
                </MkCard>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: MK.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: MK.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  networthCard: {
    backgroundColor: '#6366F1', borderRadius: MK.radius + 4, padding: 24, gap: 6,
  },
  networthLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  networthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  networthValue: { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.5, flex: 1 },
  networthSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  healthCard: { padding: 16, gap: 14 },
  healthTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthTitle: { fontSize: 15, fontWeight: '600', color: MK.textPrimary },
  scoreBadge: { borderRadius: MK.radiusPill, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 13, fontWeight: '600' },
  healthLabel: { fontSize: 13, color: MK.textSecondary },
  healthPct: { fontSize: 13, fontWeight: '600' },
  healthTrack: { height: 6, borderRadius: 3, backgroundColor: MK.border, overflow: 'hidden' },
  healthFill: { height: '100%', borderRadius: 3 },
  section: { gap: 8 },
  heatmapCard: { padding: 16 },
  heatmapRow: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
  heatmapCol: { flex: 1, alignItems: 'center', gap: 4 },
  heatmapBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden', backgroundColor: MK.fillSecondary },
  heatmapBarFill: { width: '100%', borderRadius: 4 },
  heatmapLabel: { fontSize: 10, color: MK.textSecondary },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  catIcon: { width: 36, height: 36, borderRadius: MK.radiusSm, backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 17 },
  catName: { flex: 1, fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  catAmt: { fontSize: 14, fontWeight: '600' },
  rateCard: { padding: 16, gap: 4 },
  rateLabel: { fontSize: 13, color: MK.textSecondary, fontWeight: '500' },
  rateValue: { fontSize: 32, fontWeight: '700' },
  rateSub: { fontSize: 13, color: MK.textSecondary },
  lessonCard: { padding: 12 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonEmoji: { fontSize: 24 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: MK.textPrimary },
  lessonDesc: { fontSize: 12, color: MK.textSecondary, marginTop: 2 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  doneText: { fontSize: 12, color: MK.fillGreen, fontWeight: '500' },
  minText: { fontSize: 12, color: MK.textSecondary },
});
