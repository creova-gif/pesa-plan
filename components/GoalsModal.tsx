import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '📱', '🎓', '💍', '🏥', '💼', '🌱', '🎯'];

const CHALLENGE_TEMPLATES = [
  { name: '30-Day Save Challenge', emoji: '🎯', targetDays: 30, dailyAmount: 1000 },
  { name: '52-Week Challenge', emoji: '💪', targetDays: 52, dailyAmount: 500 },
  { name: '100-Day Sprint', emoji: '🏃', targetDays: 100, dailyAmount: 2000 },
];

interface Props { onClose: () => void }

export default function GoalsModal({ onClose }: Props) {
  const { addGoal, startChallenge, state } = useApp();
  const [tab, setTab] = useState<'goal' | 'challenge'>('goal');

  // Goal form
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [days, setDays] = useState('');

  // Challenge form
  const [chName, setChName] = useState('');
  const [chEmoji, setChEmoji] = useState('🎯');
  const [chDays, setChDays] = useState('30');
  const [chDaily, setChDaily] = useState('');

  const handleSaveGoal = async () => {
    const t = parseFloat(target);
    if (!title.trim() || !t) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGoal({
      title: title.trim(),
      emoji,
      target: t,
      current: parseFloat(current) || 0,
      daysLeft: parseInt(days) || undefined,
    });
    onClose();
  };

  const handleStartChallenge = async (template?: typeof CHALLENGE_TEMPLATES[0]) => {
    if (template) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startChallenge({
        name: template.name, emoji: template.emoji,
        targetDays: template.targetDays, dailyAmount: template.dailyAmount,
        startDate: new Date().toISOString(),
      });
      onClose();
      return;
    }
    if (!chName.trim() || !parseFloat(chDaily)) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startChallenge({
      name: chName.trim(), emoji: chEmoji,
      targetDays: parseInt(chDays) || 30, dailyAmount: parseFloat(chDaily),
      startDate: new Date().toISOString(),
    });
    onClose();
  };

  const goalValid = title.trim() && parseFloat(target) > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={MK.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Goal</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'goal' && styles.tabBtnActive]} onPress={() => setTab('goal')}>
            <Text style={[styles.tabText, tab === 'goal' && styles.tabTextActive]}>Savings Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'challenge' && styles.tabBtnActive]} onPress={() => setTab('challenge')}>
            <Text style={[styles.tabText, tab === 'challenge' && styles.tabTextActive]}>Challenge</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {tab === 'goal' ? (
            <>
              {/* Emoji picker */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Icon</Text>
                <View style={styles.emojiRow}>
                  {GOAL_EMOJIS.map(e => (
                    <TouchableOpacity key={e} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]} onPress={() => setEmoji(e)}>
                      <Text style={styles.emoji}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Goal name</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Emergency fund"
                  placeholderTextColor={MK.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.sectionLabel}>Target amount</Text>
                  <TextInput
                    style={styles.input}
                    value={target}
                    onChangeText={setTarget}
                    keyboardType="numeric"
                    placeholder="500,000"
                    placeholderTextColor={MK.textSecondary}
                  />
                </View>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.sectionLabel}>Already saved</Text>
                  <TextInput
                    style={styles.input}
                    value={current}
                    onChangeText={setCurrent}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={MK.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Days to reach goal (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={days}
                  onChangeText={setDays}
                  keyboardType="numeric"
                  placeholder="90"
                  placeholderTextColor={MK.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, !goalValid && styles.saveBtnDisabled]}
                onPress={handleSaveGoal}
                disabled={!goalValid}
                activeOpacity={0.85}
              >
                <Check size={18} color="#fff" strokeWidth={2.5} />
                <Text style={styles.saveBtnText}>Save Goal</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Quick start</Text>
              <View style={{ gap: 10 }}>
                {CHALLENGE_TEMPLATES.map(t => (
                  <TouchableOpacity key={t.name} style={styles.templateCard} onPress={() => handleStartChallenge(t)} activeOpacity={0.8}>
                    <Text style={styles.templateEmoji}>{t.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateName}>{t.name}</Text>
                      <Text style={styles.templateMeta}>{t.targetDays} days · {t.dailyAmount.toLocaleString()} /day</Text>
                    </View>
                    <Text style={styles.startText}>Start →</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or custom</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Challenge name</Text>
                <TextInput
                  style={styles.input}
                  value={chName}
                  onChangeText={setChName}
                  placeholder="My savings challenge"
                  placeholderTextColor={MK.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.sectionLabel}>Days</Text>
                  <TextInput
                    style={styles.input}
                    value={chDays}
                    onChangeText={setChDays}
                    keyboardType="numeric"
                    placeholderTextColor={MK.textSecondary}
                  />
                </View>
                <View style={[styles.section, { flex: 1 }]}>
                  <Text style={styles.sectionLabel}>Daily amount</Text>
                  <TextInput
                    style={styles.input}
                    value={chDaily}
                    onChangeText={setChDaily}
                    keyboardType="numeric"
                    placeholder="1,000"
                    placeholderTextColor={MK.textSecondary}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, !chName.trim() && styles.saveBtnDisabled]}
                onPress={() => handleStartChallenge()}
                disabled={!chName.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>Start Challenge</Text>
              </TouchableOpacity>
            </>
          )}

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
  tabRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: MK.border,
  },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: MK.radiusSm,
    alignItems: 'center', backgroundColor: MK.fillSecondary,
  },
  tabBtnActive: { backgroundColor: MK.fillOrange },
  tabText: { fontSize: 14, fontWeight: '600', color: MK.textSecondary },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 6 },
  sectionLabel: { fontSize: 13, fontWeight: '500', color: MK.textSecondary },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: MK.radiusSm, backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { backgroundColor: '#FFF1E8', borderWidth: 1.5, borderColor: MK.fillOrange },
  emoji: { fontSize: 22 },
  input: {
    borderWidth: 1, borderColor: MK.border, borderRadius: MK.radiusSm,
    padding: 12, fontSize: 15, color: MK.textPrimary, backgroundColor: MK.fillSecondary,
  },
  row: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    backgroundColor: MK.fillOrange, borderRadius: MK.radius, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnDisabled: { backgroundColor: '#DDD' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  templateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: MK.radius, backgroundColor: MK.fillSecondary,
    borderWidth: 1, borderColor: MK.border,
  },
  templateEmoji: { fontSize: 24 },
  templateName: { fontSize: 14, fontWeight: '600', color: MK.textPrimary },
  templateMeta: { fontSize: 12, color: MK.textSecondary, marginTop: 2 },
  startText: { fontSize: 14, fontWeight: '600', color: MK.fillOrange },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: MK.border },
  dividerText: { fontSize: 12, color: MK.textSecondary },
});
