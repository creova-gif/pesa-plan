import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { X, Search, Trash2 } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { MkCard, Divider } from '@/components/ui';
import type { TransactionType } from '@/lib/AppContext';

interface Props { onClose: () => void }

export default function HistoryView({ onClose }: Props) {
  const { state, deleteTransaction } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const filtered = state.transactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.category.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = (id: string) => {
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  // Group by date
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach(t => {
    const day = new Date(t.date).toDateString();
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(t);
  });
  const days = Object.keys(grouped);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color={MK.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search + filter */}
      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Search size={16} color={MK.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search…"
            placeholderTextColor={MK.textSecondary}
          />
        </View>
        <View style={styles.filterRow}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {days.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          days.map(day => (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayLabel}>{formatDay(day)}</Text>
              <MkCard>
                {grouped[day].map((tx, i) => (
                  <View key={tx.id}>
                    {i > 0 && <Divider />}
                    <View style={styles.txRow}>
                      <View style={styles.txIcon}>
                        <Text style={styles.txEmoji}>{getCategoryIcon(tx.category)}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txCat}>{tx.category}</Text>
                        <Text style={styles.txMeta}>{tx.source}{tx.notes ? ` · ${tx.notes}` : ''}</Text>
                      </View>
                      <Text style={[styles.txAmt, { color: tx.type === 'income' ? MK.textIncome : MK.textExpense }]}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, state.region)}
                      </Text>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(tx.id)}>
                        <Trash2 size={15} color={MK.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </MkCard>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  if (dateStr === today) return 'Today';
  if (dateStr === yest) return 'Yesterday';
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: MK.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: MK.textPrimary },
  controls: { backgroundColor: '#fff', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: MK.border },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: MK.fillSecondary, borderRadius: MK.radiusSm,
    paddingHorizontal: 12, height: 38,
  },
  searchInput: { flex: 1, fontSize: 14, color: MK.textPrimary },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: MK.radiusPill,
    backgroundColor: MK.fillSecondary,
  },
  filterBtnActive: { backgroundColor: MK.fillOrange },
  filterText: { fontSize: 13, fontWeight: '500', color: MK.textSecondary },
  filterTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  daySection: { gap: 8 },
  dayLabel: { fontSize: 12, fontWeight: '600', color: MK.textSecondary, paddingHorizontal: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  txIcon: { width: 36, height: 36, borderRadius: MK.radiusSm, backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center' },
  txEmoji: { fontSize: 17 },
  txInfo: { flex: 1, gap: 2 },
  txCat: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  txMeta: { fontSize: 11, color: MK.textSecondary },
  txAmt: { fontSize: 14, fontWeight: '600' },
  deleteBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: MK.textSecondary },
});
