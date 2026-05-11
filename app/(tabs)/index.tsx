import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, RefreshControl, StatusBar,
} from 'react-native';
import { Plus, Bell, Flame, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { MkCard, StripeProgressBar, Divider } from '@/components/ui';
import AddTransactionModal from '@/components/AddTransactionModal';
import NotificationCenter from '@/components/NotificationCenter';

export default function HomeTab() {
  const {
    state, getTodayIncome, getTodayExpenses, dismissNotification,
  } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const totalBalance = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;
  const todayIncome = getTodayIncome();
  const todayExpenses = getTodayExpenses();
  const net = todayIncome - todayExpenses;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentTx = state.transactions.slice(0, 5);
  const activeGoals = state.goals.filter(g => !g.completed).slice(0, 3);

  const undismissedNotifs = [
    state.streak >= 3 && !state.dismissedNotifications.includes('streak') && {
      id: 'streak',
      title: `${state.streak}-day streak! 🔥`,
      body: 'Keep logging daily to build your habit.',
    },
    state.emergencyMode && !state.dismissedNotifications.includes('emergency') && {
      id: 'emergency',
      title: 'Emergency Mode Active',
      body: 'Non-essential spending is paused.',
    },
  ].filter(Boolean) as { id: string; title: string; body: string }[];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}{state.userName ? `, ${state.userName.split(' ')[0]}` : ''}</Text>
          <View style={styles.streakRow}>
            <Flame size={13} color={state.streak > 0 ? '#FD8240' : '#C5C3C0'} />
            <Text style={styles.streakText}>{state.streak} day streak</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => setNotifOpen(true)}>
          <Bell size={20} color={MK.textPrimary} />
          {undismissedNotifs.length > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MK.fillOrange} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance, state.region)}</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <ArrowDownRight size={14} color={MK.textIncome} />
              <Text style={[styles.todayAmount, { color: MK.textIncome }]}>{formatCurrency(todayIncome, state.region)}</Text>
              <Text style={styles.todayLabel}>today in</Text>
            </View>
            <View style={styles.todayStat}>
              <ArrowUpRight size={14} color={MK.textExpense} />
              <Text style={[styles.todayAmount, { color: MK.textExpense }]}>{formatCurrency(todayExpenses, state.region)}</Text>
              <Text style={styles.todayLabel}>today out</Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={[styles.todayAmount, { color: net >= 0 ? MK.textIncome : MK.textExpense }]}>
                {net >= 0 ? '+' : ''}{formatCurrency(net, state.region)}
              </Text>
              <Text style={styles.todayLabel}>net</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <ChevronRight size={16} color={MK.textSecondary} />
            </View>
            <MkCard>
              {activeGoals.map((goal, i) => (
                <View key={goal.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.goalRow}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalEmoji}>{goal.emoji || '🎯'}</Text>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <StripeProgressBar value={goal.current} max={goal.target} />
                        <Text style={styles.goalProgress}>
                          {formatCurrency(goal.current, state.region)} / {formatCurrency(goal.target, state.region)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </MkCard>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <ChevronRight size={16} color={MK.textSecondary} />
          </View>
          {recentTx.length === 0 ? (
            <MkCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubText}>Tap + to log your first one</Text>
            </MkCard>
          ) : (
            <MkCard>
              {recentTx.map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.txRow}>
                    <View style={styles.txIcon}>
                      <Text style={styles.txEmoji}>{getCategoryIcon(tx.category)}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txCategory}>{tx.category}</Text>
                      <Text style={styles.txSource}>{tx.source} · {new Date(tx.date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? MK.textIncome : MK.textExpense }]}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, state.region)}
                    </Text>
                  </View>
                </View>
              ))}
            </MkCard>
          )}
        </View>

        {/* Round-up savings info */}
        {state.roundUpEnabled && state.roundUpSavings > 0 && (
          <MkCard style={styles.roundUpCard}>
            <Text style={styles.roundUpTitle}>Round-up Savings 🪙</Text>
            <Text style={styles.roundUpAmount}>{formatCurrency(state.roundUpSavings, state.region)}</Text>
            <Text style={styles.roundUpSub}>saved automatically from purchases</Text>
          </MkCard>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddOpen(true)} activeOpacity={0.85}>
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <AddTransactionModal onClose={() => setAddOpen(false)} />
      </Modal>

      <Modal visible={notifOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNotifOpen(false)}>
        <NotificationCenter notifications={undismissedNotifs} onDismiss={dismissNotification} onClose={() => setNotifOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: MK.border,
  },
  greeting: { fontSize: 17, fontWeight: '600', color: MK.textPrimary },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  streakText: { fontSize: 12, color: MK.textSecondary },
  bellBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4, backgroundColor: MK.fillOrange,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  balanceCard: {
    backgroundColor: MK.textPrimary, borderRadius: MK.radius + 4,
    padding: 24, gap: 6,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  balanceAmount: { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  todayRow: {
    flexDirection: 'row', marginTop: 8, gap: 0,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 12,
  },
  todayStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  todayAmount: { fontSize: 13, fontWeight: '600' },
  todayLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: MK.textPrimary },
  goalRow: { padding: 14 },
  goalInfo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  goalEmoji: { fontSize: 22, marginTop: 2 },
  goalTitle: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  goalProgress: { fontSize: 11, color: MK.textSecondary },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  txIcon: {
    width: 38, height: 38, borderRadius: MK.radiusSm,
    backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center',
  },
  txEmoji: { fontSize: 18 },
  txInfo: { flex: 1, gap: 2 },
  txCategory: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  txSource: { fontSize: 12, color: MK.textSecondary },
  txAmount: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 28, alignItems: 'center', gap: 4 },
  emptyText: { fontSize: 15, fontWeight: '500', color: MK.textPrimary },
  emptySubText: { fontSize: 13, color: MK.textSecondary },
  roundUpCard: { padding: 16, gap: 2 },
  roundUpTitle: { fontSize: 13, fontWeight: '500', color: MK.textSecondary },
  roundUpAmount: { fontSize: 22, fontWeight: '700', color: MK.fillGreen },
  roundUpSub: { fontSize: 12, color: MK.textSecondary },
  fab: {
    position: 'absolute', bottom: 88, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: MK.fillOrange, alignItems: 'center', justifyContent: 'center',
    shadowColor: MK.fillOrange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
