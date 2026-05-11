import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Modal,
} from 'react-native';
import { Plus, AlertCircle } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { MkCard, StripeProgressBar, Divider, Pill } from '@/components/ui';
import AddTransactionModal from '@/components/AddTransactionModal';

type Period = 'today' | 'week' | 'month';

function getDateRange(period: Period) {
  const now = new Date();
  const start = new Date();
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

export default function BudgetTab() {
  const { state, setCategoryBudget } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const [addOpen, setAddOpen] = useState(false);

  const start = getDateRange(period);
  const filtered = state.transactions.filter(t => new Date(t.date) >= start);
  const expenses = filtered.filter(t => t.type === 'expense');
  const income = filtered.filter(t => t.type === 'income');

  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const periodLabel = period === 'today' ? "Today's" : period === 'week' ? "This week's" : "This month's";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Plus size={18} color={MK.fillOrange} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period selector */}
        <View style={styles.pillRow}>
          {(['today', 'week', 'month'] as Period[]).map(p => (
            <Pill key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} active={period === p} onPress={() => setPeriod(p)} color={MK.fillOrange} />
          ))}
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <MkCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, { color: MK.textExpense }]}>{formatCurrency(totalSpent, state.region)}</Text>
          </MkCard>
          <MkCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Earned</Text>
            <Text style={[styles.summaryValue, { color: MK.textIncome }]}>{formatCurrency(totalIncome, state.region)}</Text>
          </MkCard>
          <MkCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, { color: totalIncome - totalSpent >= 0 ? MK.textIncome : MK.textExpense }]}>
              {formatCurrency(totalIncome - totalSpent, state.region)}
            </Text>
          </MkCard>
        </View>

        {/* Emergency mode banner */}
        {state.emergencyMode && (
          <View style={styles.emergencyBanner}>
            <AlertCircle size={16} color='#B45309' />
            <Text style={styles.emergencyText}>Emergency Mode: track essentials only</Text>
          </View>
        )}

        {/* Spending by category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{periodLabel} spending</Text>
          {categories.length === 0 ? (
            <MkCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No expenses recorded</Text>
            </MkCard>
          ) : (
            <MkCard>
              {categories.map(([cat, amount], i) => {
                const budget = state.categoryBudgets[cat];
                const over = budget && amount > budget;
                return (
                  <View key={cat}>
                    {i > 0 && <Divider />}
                    <View style={styles.catRow}>
                      <View style={styles.catLeft}>
                        <View style={styles.catIconBox}>
                          <Text style={styles.catEmoji}>{getCategoryIcon(cat)}</Text>
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <View style={styles.catTitleRow}>
                            <Text style={styles.catName}>{cat}</Text>
                            {over && <AlertCircle size={13} color={MK.textExpense} />}
                          </View>
                          {budget ? (
                            <StripeProgressBar value={amount} max={budget} />
                          ) : (
                            <View style={styles.noBudgetBar} />
                          )}
                          <Text style={styles.catSub}>
                            {formatCurrency(amount, state.region)}
                            {budget ? ` / ${formatCurrency(budget, state.region)}` : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </MkCard>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <AddTransactionModal onClose={() => setAddOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: MK.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: MK.textPrimary },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF1E8', alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  pillRow: { flexDirection: 'row', gap: 8 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, padding: 12, gap: 4, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: MK.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  emergencyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: MK.radiusSm,
    padding: 12, borderWidth: 1, borderColor: '#FDE68A',
  },
  emergencyText: { fontSize: 13, color: '#92400E', fontWeight: '500', flex: 1 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: MK.textPrimary, paddingHorizontal: 2 },
  emptyCard: { padding: 28, alignItems: 'center' },
  emptyText: { fontSize: 14, color: MK.textSecondary },
  catRow: { padding: 14 },
  catLeft: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  catIconBox: {
    width: 38, height: 38, borderRadius: MK.radiusSm,
    backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center',
  },
  catEmoji: { fontSize: 18 },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  catSub: { fontSize: 11, color: MK.textSecondary },
  noBudgetBar: { height: 4, borderRadius: 2, backgroundColor: MK.border },
});
