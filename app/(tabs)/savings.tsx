import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Modal, Alert, TextInput,
} from 'react-native';
import { Plus, Trophy, CheckCircle, X, Flame } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { formatCurrency } from '@/utils/currency';
import { MkCard, StripeProgressBar, Divider, SectionHeader } from '@/components/ui';
import GoalsModal from '@/components/GoalsModal';

export default function SavingsTab() {
  const { state, updateGoal, deleteGoal, logChallengeDay, abandonChallenge, startChallenge } = useApp();
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [logAmount, setLogAmount] = useState('');
  const [logTarget, setLogTarget] = useState<string | null>(null);

  const activeGoals = state.goals.filter(g => !g.completed);
  const completedGoals = state.goals.filter(g => g.completed);
  const totalSaved = state.goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);

  const activeChallenges = state.challenges.filter(c => !c.completed);

  const handleLog = (goalId: string) => {
    const amt = parseFloat(logAmount);
    if (isNaN(amt) || amt <= 0) return;
    updateGoal(goalId, amt);
    setLogAmount('');
    setLogTarget(null);
  };

  const handleAbandon = (id: string) => {
    Alert.alert('Abandon Challenge', 'Are you sure? Progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Abandon', style: 'destructive', onPress: () => abandonChallenge(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>Savings</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setGoalsOpen(true)}>
          <Plus size={18} color={MK.fillOrange} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Saved</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalSaved, state.region)}</Text>
          {totalTarget > 0 && (
            <>
              <StripeProgressBar value={totalSaved} max={totalTarget} />
              <Text style={styles.summarySubText}>of {formatCurrency(totalTarget, state.region)} goal</Text>
            </>
          )}
        </View>

        {/* Round-up savings */}
        {state.roundUpEnabled && (
          <MkCard style={styles.roundUpCard}>
            <Text style={styles.roundUpTitle}>🪙 Round-up Savings</Text>
            <Text style={styles.roundUpAmount}>{formatCurrency(state.roundUpSavings, state.region)}</Text>
            <Text style={styles.roundUpSub}>auto-saved from purchases</Text>
          </MkCard>
        )}

        {/* Active Goals */}
        <View style={styles.section}>
          <SectionHeader label="Goals" sub={`${activeGoals.length} active`} />
          {activeGoals.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => setGoalsOpen(true)}>
              <Text style={styles.emptyText}>Set your first savings goal</Text>
              <Text style={styles.emptyAddText}>Tap + to add one</Text>
            </TouchableOpacity>
          ) : (
            <MkCard>
              {activeGoals.map((goal, i) => (
                <View key={goal.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.goalCard}>
                    <View style={styles.goalTop}>
                      <Text style={styles.goalEmoji}>{goal.emoji || '🎯'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        {goal.daysLeft != null && (
                          <Text style={styles.goalDays}>{goal.daysLeft} days left</Text>
                        )}
                      </View>
                      <Text style={styles.goalPct}>
                        {Math.min(100, Math.round((goal.current / goal.target) * 100))}%
                      </Text>
                    </View>
                    <StripeProgressBar value={goal.current} max={goal.target} />
                    <Text style={styles.goalProgress}>
                      {formatCurrency(goal.current, state.region)} of {formatCurrency(goal.target, state.region)}
                    </Text>

                    {logTarget === goal.id ? (
                      <View style={styles.logRow}>
                        <TextInput
                          style={styles.logInput}
                          value={logAmount}
                          onChangeText={setLogAmount}
                          keyboardType="numeric"
                          placeholder="Amount"
                          placeholderTextColor={MK.textSecondary}
                          autoFocus
                        />
                        <TouchableOpacity style={styles.logConfirm} onPress={() => handleLog(goal.id)}>
                          <Text style={styles.logConfirmText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logCancel} onPress={() => setLogTarget(null)}>
                          <X size={16} color={MK.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.goalActions}>
                        <TouchableOpacity style={styles.addFundsBtn} onPress={() => setLogTarget(goal.id)}>
                          <Text style={styles.addFundsText}>Add funds</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </MkCard>
          )}
        </View>

        {/* Savings Challenges */}
        {activeChallenges.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Challenges" sub={`${activeChallenges.length} active`} />
            <MkCard>
              {activeChallenges.map((ch, i) => {
                const pct = Math.min(100, Math.round((ch.contributions.length / ch.targetDays) * 100));
                const dayTotal = ch.contributions.reduce((s, a) => s + a, 0);
                return (
                  <View key={ch.id}>
                    {i > 0 && <Divider />}
                    <View style={styles.challengeCard}>
                      <View style={styles.challengeTop}>
                        <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.challengeName}>{ch.name}</Text>
                          <View style={styles.challengeStats}>
                            <Flame size={12} color={MK.fillOrange} />
                            <Text style={styles.challengeDays}>{ch.contributions.length}/{ch.targetDays} days</Text>
                          </View>
                        </View>
                        <Text style={styles.challengePct}>{pct}%</Text>
                      </View>
                      <StripeProgressBar value={ch.contributions.length} max={ch.targetDays} />
                      <Text style={styles.challengeSaved}>{formatCurrency(dayTotal, state.region)} saved</Text>
                      <TouchableOpacity onPress={() => handleAbandon(ch.id)}>
                        <Text style={styles.abandonText}>Abandon</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </MkCard>
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Completed" sub={`${completedGoals.length} goals`} />
            <MkCard>
              {completedGoals.map((goal, i) => (
                <View key={goal.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.completedRow}>
                    <Trophy size={18} color={MK.fillOrange} />
                    <Text style={styles.completedTitle}>{goal.emoji} {goal.title}</Text>
                    <CheckCircle size={16} color={MK.fillGreen} />
                  </View>
                </View>
              ))}
            </MkCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={goalsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setGoalsOpen(false)}>
        <GoalsModal onClose={() => setGoalsOpen(false)} />
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
  summaryCard: {
    backgroundColor: MK.fillGreen, borderRadius: MK.radius + 4,
    padding: 24, gap: 8,
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  summaryValue: { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  summarySubText: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  roundUpCard: { padding: 16, gap: 4 },
  roundUpTitle: { fontSize: 13, fontWeight: '600', color: MK.textPrimary },
  roundUpAmount: { fontSize: 22, fontWeight: '700', color: MK.fillGreen },
  roundUpSub: { fontSize: 12, color: MK.textSecondary },
  section: { gap: 8 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: MK.radius, borderWidth: 1,
    borderColor: MK.border, borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 4,
  },
  emptyText: { fontSize: 15, fontWeight: '500', color: MK.textPrimary },
  emptyAddText: { fontSize: 13, color: MK.fillOrange },
  goalCard: { padding: 14, gap: 6 },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalEmoji: { fontSize: 22 },
  goalTitle: { fontSize: 14, fontWeight: '600', color: MK.textPrimary },
  goalDays: { fontSize: 12, color: MK.textSecondary },
  goalPct: { fontSize: 14, fontWeight: '700', color: MK.fillOrange },
  goalProgress: { fontSize: 12, color: MK.textSecondary },
  logRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  logInput: {
    flex: 1, height: 38, borderRadius: MK.radiusSm,
    borderWidth: 1, borderColor: MK.border, paddingHorizontal: 12,
    fontSize: 14, color: MK.textPrimary, backgroundColor: MK.fillSecondary,
  },
  logConfirm: {
    backgroundColor: MK.fillOrange, borderRadius: MK.radiusSm,
    paddingHorizontal: 14, height: 38, justifyContent: 'center',
  },
  logConfirmText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  logCancel: {
    width: 38, height: 38, borderRadius: MK.radiusSm,
    backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center',
  },
  goalActions: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  addFundsBtn: {
    backgroundColor: MK.fillOrange, borderRadius: MK.radiusSm,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addFundsText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  deleteText: { fontSize: 13, color: MK.textSecondary },
  challengeCard: { padding: 14, gap: 6 },
  challengeTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  challengeEmoji: { fontSize: 22 },
  challengeName: { fontSize: 14, fontWeight: '600', color: MK.textPrimary },
  challengeStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  challengeDays: { fontSize: 12, color: MK.textSecondary },
  challengePct: { fontSize: 14, fontWeight: '700', color: MK.fillOrange },
  challengeSaved: { fontSize: 12, color: MK.textSecondary },
  abandonText: { fontSize: 13, color: MK.textSecondary, marginTop: 4 },
  completedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  completedTitle: { flex: 1, fontSize: 14, fontWeight: '500', color: MK.textPrimary },
});
