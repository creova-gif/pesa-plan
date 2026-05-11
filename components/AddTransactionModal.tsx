import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import type { TransactionType, PaymentSource } from '@/lib/AppContext';

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Rent', 'Utilities', 'Health', 'Education',
  'Entertainment', 'Clothing', 'Airtime', 'Savings', 'Loan', 'Other',
];

const INCOME_CATEGORIES = [
  'Salary', 'Business', 'Freelance', 'Side hustle', 'Gift', 'Investment', 'Other',
];

const SOURCES: { id: PaymentSource; label: string; emoji: string }[] = [
  { id: 'cash', label: 'Cash', emoji: '💵' },
  { id: 'mpesa', label: 'M-Pesa', emoji: '📱' },
  { id: 'airtel', label: 'Airtel', emoji: '📲' },
  { id: 'tigo', label: 'Tigo', emoji: '📟' },
  { id: 'bank', label: 'Bank', emoji: '🏦' },
  { id: 'loan', label: 'Loan', emoji: '💳' },
];

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface Props { onClose: () => void }

export default function AddTransactionModal({ onClose }: Props) {
  const { addTransaction, state } = useApp();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState<PaymentSource>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !category) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    addTransaction({ type, amount: amt, category, source, notes: notes.trim() || undefined });
    onClose();
  };

  const valid = parseFloat(amount) > 0 && !!category;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={MK.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
          <TouchableOpacity
            style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!valid || saving}
          >
            <Check size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Type toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
              onPress={() => { setType('expense'); setCategory(''); }}
            >
              <Text style={[styles.typeBtnText, type === 'expense' && { color: '#fff' }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
              onPress={() => { setType('income'); setCategory(''); }}
            >
              <Text style={[styles.typeBtnText, type === 'income' && { color: '#fff' }]}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.currencySymbol}>{state.region === 'TZ' ? 'TSh' : state.region === 'KE' ? 'KSh' : state.region === 'UG' ? 'USh' : 'RWF'}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chipRow}>
              {cats.map(c => (
                <CategoryChip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          </View>

          {/* Source */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment source</Text>
            <View style={styles.chipRow}>
              {SOURCES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sourceChip, source === s.id && styles.sourceChipActive]}
                  onPress={() => setSource(s.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sourceEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sourceLabel, source === s.id && { color: MK.fillOrange }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note…"
              placeholderTextColor={MK.textSecondary}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: MK.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: MK.textPrimary },
  saveBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: MK.fillOrange, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#DDD' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20 },
  typeRow: {
    flexDirection: 'row', backgroundColor: MK.fillSecondary,
    borderRadius: MK.radius, padding: 4, gap: 4,
  },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: MK.radiusSm,
    alignItems: 'center',
  },
  typeBtnExpense: { backgroundColor: MK.textExpense },
  typeBtnIncome: { backgroundColor: MK.textIncome },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: MK.textSecondary },
  amountCard: {
    backgroundColor: MK.textPrimary, borderRadius: MK.radius + 4,
    padding: 24, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  currencySymbol: { fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 6 },
  amountInput: { fontSize: 42, fontWeight: '700', color: '#fff', flex: 1, letterSpacing: -1 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '500', color: MK.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: MK.radiusPill,
    backgroundColor: MK.fillSecondary, borderWidth: 1, borderColor: MK.border,
  },
  chipActive: { backgroundColor: MK.fillOrange + '20', borderColor: MK.fillOrange },
  chipText: { fontSize: 13, fontWeight: '500', color: MK.textPrimary },
  chipTextActive: { color: MK.fillOrange },
  sourceChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: MK.radiusSm,
    backgroundColor: MK.fillSecondary, borderWidth: 1, borderColor: MK.border,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  sourceChipActive: { borderColor: MK.fillOrange, backgroundColor: '#FFF1E8' },
  sourceEmoji: { fontSize: 16 },
  sourceLabel: { fontSize: 13, fontWeight: '500', color: MK.textPrimary },
  notesInput: {
    borderWidth: 1, borderColor: MK.border, borderRadius: MK.radiusSm,
    padding: 12, fontSize: 14, color: MK.textPrimary, backgroundColor: MK.fillSecondary,
    minHeight: 60, textAlignVertical: 'top',
  },
});
