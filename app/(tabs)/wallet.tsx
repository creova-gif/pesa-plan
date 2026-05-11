import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Modal, Alert,
} from 'react-native';
import { Settings, History, Shield, ToggleLeft, ToggleRight, Banknote, Smartphone, Building2, CreditCard } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { formatCurrency } from '@/utils/currency';
import { MkCard, Divider, SectionHeader } from '@/components/ui';
import SettingsView from '@/components/SettingsView';
import HistoryView from '@/components/HistoryView';
import AppLock from '@/components/AppLock';

export default function WalletTab() {
  const { state, toggleEmergencyMode, toggleRoundUp } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  const wallets = [
    { id: 'cash', label: 'Cash', icon: Banknote, balance: state.cashBalance, color: '#4E886F' },
    { id: 'mobile', label: 'Mobile Money', icon: Smartphone, balance: state.mobileMoneyBalance, color: '#FD8240' },
    { id: 'bank', label: 'Bank', icon: Building2, balance: state.bankBalance, color: '#6366F1' },
    { id: 'loan', label: 'Loan', icon: CreditCard, balance: state.loanBalance, color: '#C9362B' },
  ];

  const totalAssets = state.cashBalance + state.mobileMoneyBalance + state.bankBalance;

  const handleEmergency = () => {
    Alert.alert(
      state.emergencyMode ? 'Disable Emergency Mode' : 'Enable Emergency Mode',
      state.emergencyMode
        ? 'Resume normal spending tracking?'
        : 'This will restrict spending tracking to essentials only.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: state.emergencyMode ? 'Disable' : 'Enable', onPress: toggleEmergencyMode },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setHistoryOpen(true)}>
            <History size={20} color={MK.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsOpen(true)}>
            <Settings size={20} color={MK.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Total Assets Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Assets</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAssets, state.region)}</Text>
          {state.loanBalance > 0 && (
            <Text style={styles.loanNote}>Loan: {formatCurrency(state.loanBalance, state.region)} outstanding</Text>
          )}
        </View>

        {/* Wallet Balances */}
        <View style={styles.section}>
          <SectionHeader label="Balances" />
          <View style={styles.balanceGrid}>
            {wallets.map(w => (
              <MkCard key={w.id} style={styles.walletCard}>
                <View style={[styles.walletIconWrap, { backgroundColor: w.color + '15' }]}>
                  <w.icon size={20} color={w.color} />
                </View>
                <Text style={styles.walletLabel}>{w.label}</Text>
                <Text style={[styles.walletBalance, { color: w.id === 'loan' ? MK.textExpense : MK.textPrimary }]}>
                  {w.id === 'loan' ? '-' : ''}{formatCurrency(w.balance, state.region)}
                </Text>
              </MkCard>
            ))}
          </View>
        </View>

        {/* Quick toggles */}
        <View style={styles.section}>
          <SectionHeader label="Quick settings" />
          <MkCard>
            <TouchableOpacity style={styles.toggleRow} onPress={handleEmergency} activeOpacity={0.7}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: state.emergencyMode ? '#FEF3C720' : MK.fillSecondary }]}>
                  <Shield size={18} color={state.emergencyMode ? '#B45309' : MK.textSecondary} />
                </View>
                <View>
                  <Text style={styles.toggleTitle}>Emergency Mode</Text>
                  <Text style={styles.toggleSub}>Restrict to essential spending</Text>
                </View>
              </View>
              {state.emergencyMode
                ? <ToggleRight size={26} color={MK.fillOrange} />
                : <ToggleLeft size={26} color={MK.textSecondary} />
              }
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity style={styles.toggleRow} onPress={toggleRoundUp} activeOpacity={0.7}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIcon}>
                  <Text style={{ fontSize: 18 }}>🪙</Text>
                </View>
                <View>
                  <Text style={styles.toggleTitle}>Round-up Savings</Text>
                  <Text style={styles.toggleSub}>Auto-save spare change</Text>
                </View>
              </View>
              {state.roundUpEnabled
                ? <ToggleRight size={26} color={MK.fillOrange} />
                : <ToggleLeft size={26} color={MK.textSecondary} />
              }
            </TouchableOpacity>
          </MkCard>
        </View>

        {/* Round-up info */}
        {state.roundUpEnabled && state.roundUpSavings > 0 && (
          <MkCard style={styles.roundUpCard}>
            <Text style={styles.roundUpEmoji}>🪙</Text>
            <View>
              <Text style={styles.roundUpTitle}>Round-up balance</Text>
              <Text style={styles.roundUpAmt}>{formatCurrency(state.roundUpSavings, state.region)}</Text>
            </View>
          </MkCard>
        )}

        {/* App Security */}
        <View style={styles.section}>
          <SectionHeader label="Security" />
          <MkCard>
            <TouchableOpacity style={styles.menuRow} onPress={() => setLockOpen(true)} activeOpacity={0.7}>
              <Shield size={18} color={MK.textSecondary} />
              <Text style={styles.menuText}>App Lock (PIN)</Text>
              <Text style={styles.menuBadge}>{state.appLockEnabled ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </MkCard>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <SectionHeader label="Activity" />
          <View style={styles.statsRow}>
            <MkCard style={styles.statCard}>
              <Text style={styles.statValue}>{state.transactions.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </MkCard>
            <MkCard style={styles.statCard}>
              <Text style={styles.statValue}>{state.streak}</Text>
              <Text style={styles.statLabel}>Day streak 🔥</Text>
            </MkCard>
            <MkCard style={styles.statCard}>
              <Text style={styles.statValue}>{state.goals.filter(g => g.completed).length}</Text>
              <Text style={styles.statLabel}>Goals done</Text>
            </MkCard>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={settingsOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setSettingsOpen(false)}>
        <SettingsView onClose={() => setSettingsOpen(false)} />
      </Modal>

      <Modal visible={historyOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHistoryOpen(false)}>
        <HistoryView onClose={() => setHistoryOpen(false)} />
      </Modal>

      <Modal visible={lockOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLockOpen(false)}>
        <AppLock mode="setup" onClose={() => setLockOpen(false)} />
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
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  totalCard: {
    backgroundColor: MK.textPrimary, borderRadius: MK.radius + 4, padding: 24, gap: 6,
  },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  loanNote: { fontSize: 12, color: 'rgba(255,100,100,0.8)', marginTop: 2 },
  section: { gap: 8 },
  balanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  walletCard: { width: '47%', padding: 14, gap: 6 },
  walletIconWrap: { width: 38, height: 38, borderRadius: MK.radiusSm, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontSize: 12, color: MK.textSecondary, fontWeight: '500' },
  walletBalance: { fontSize: 16, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIcon: {
    width: 38, height: 38, borderRadius: MK.radiusSm,
    backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center',
  },
  toggleTitle: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  toggleSub: { fontSize: 12, color: MK.textSecondary, marginTop: 1 },
  roundUpCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundUpEmoji: { fontSize: 28 },
  roundUpTitle: { fontSize: 13, color: MK.textSecondary, fontWeight: '500' },
  roundUpAmt: { fontSize: 20, fontWeight: '700', color: MK.fillGreen },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  menuBadge: {
    fontSize: 11, fontWeight: '600', color: MK.fillGreen,
    backgroundColor: MK.fillGreen + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: MK.radiusPill,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: MK.textPrimary },
  statLabel: { fontSize: 11, color: MK.textSecondary, textAlign: 'center' },
});
