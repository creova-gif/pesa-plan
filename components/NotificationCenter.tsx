import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { X, Bell } from 'lucide-react-native';
import { MK } from '@/lib/theme';

interface Notification {
  id: string;
  title: string;
  body: string;
}

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onClose: () => void;
}

export default function NotificationCenter({ notifications, onDismiss, onClose }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color={MK.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Bell size={40} color={MK.border} />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySub}>No new notifications</Text>
          </View>
        ) : (
          notifications.map(n => (
            <View key={n.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody}>{n.body}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.dismissBtn} onPress={() => onDismiss(n.id)}>
                <X size={14} color={MK.textSecondary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 17, fontWeight: '600', color: MK.textPrimary },
  emptySub: { fontSize: 14, color: MK.textSecondary },
  card: {
    backgroundColor: '#fff', borderRadius: MK.radius, borderWidth: 1, borderColor: MK.border,
    padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  cardContent: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: MK.fillOrange, marginTop: 5 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: MK.textPrimary },
  notifBody: { fontSize: 13, color: MK.textSecondary, marginTop: 2 },
  dismissBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
