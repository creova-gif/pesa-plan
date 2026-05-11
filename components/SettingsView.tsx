import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, TextInput, Switch,
} from 'react-native';
import {
  X, Globe, User, MapPin, DollarSign, Trash2, ChevronRight,
  Shield, Bell, Info,
} from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { MkCard, Divider } from '@/components/ui';
import type { Language, UserType, IncomeFrequency } from '@/lib/AppContext';
import type { Region } from '@/utils/currency';

const LANGUAGES: { id: Language; label: string; flag: string }[] = [
  { id: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
];

const REGIONS: { id: Region; label: string; flag: string }[] = [
  { id: 'TZ', label: 'Tanzania', flag: '🇹🇿' },
  { id: 'KE', label: 'Kenya', flag: '🇰🇪' },
  { id: 'UG', label: 'Uganda', flag: '🇺🇬' },
  { id: 'RW', label: 'Rwanda', flag: '🇷🇼' },
  { id: 'BI', label: 'Burundi', flag: '🇧🇮' },
];

interface Props { onClose: () => void }

export default function SettingsView({ onClose }: Props) {
  const {
    state, setLanguage, setRegion, setUserName,
    clearAllData, toggleEmergencyMode, toggleRoundUp,
    setLoanBalance,
  } = useApp();

  const [nameEdit, setNameEdit] = useState(state.userName);
  const [loanEdit, setLoanEdit] = useState(state.loanBalance.toString());

  const handleClearData = () => {
    Alert.alert(
      'Clear all data',
      'This will permanently delete all your transactions, goals, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything', style: 'destructive',
          onPress: () => { clearAllData(); onClose(); },
        },
      ]
    );
  };

  const saveName = () => {
    if (nameEdit.trim()) setUserName(nameEdit.trim());
  };

  const saveLoan = () => {
    const amt = parseFloat(loanEdit);
    if (!isNaN(amt) && amt >= 0) setLoanBalance(amt);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color={MK.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <MkCard>
            <View style={styles.inputRow}>
              <User size={18} color={MK.textSecondary} />
              <TextInput
                style={styles.inlineInput}
                value={nameEdit}
                onChangeText={setNameEdit}
                placeholder="Your name"
                placeholderTextColor={MK.textSecondary}
                onEndEditing={saveName}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
            </View>
          </MkCard>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Language</Text>
          <MkCard>
            {LANGUAGES.map((lang, i) => (
              <View key={lang.id}>
                {i > 0 && <Divider />}
                <TouchableOpacity style={styles.optionRow} onPress={() => setLanguage(lang.id)} activeOpacity={0.7}>
                  <Text style={styles.optionFlag}>{lang.flag}</Text>
                  <Text style={styles.optionLabel}>{lang.label}</Text>
                  {state.language === lang.id && (
                    <View style={styles.checkDot} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </MkCard>
        </View>

        {/* Region */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Region</Text>
          <MkCard>
            {REGIONS.map((r, i) => (
              <View key={r.id}>
                {i > 0 && <Divider />}
                <TouchableOpacity style={styles.optionRow} onPress={() => setRegion(r.id)} activeOpacity={0.7}>
                  <Text style={styles.optionFlag}>{r.flag}</Text>
                  <Text style={styles.optionLabel}>{r.label}</Text>
                  {state.region === r.id && <View style={styles.checkDot} />}
                </TouchableOpacity>
              </View>
            ))}
          </MkCard>
        </View>

        {/* Finances */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Finances</Text>
          <MkCard>
            <View style={styles.inputRow}>
              <DollarSign size={18} color={MK.textSecondary} />
              <Text style={styles.inputLabel}>Outstanding loan</Text>
              <TextInput
                style={styles.inlineInputRight}
                value={loanEdit}
                onChangeText={setLoanEdit}
                keyboardType="numeric"
                onEndEditing={saveLoan}
                onSubmitEditing={saveLoan}
                returnKeyType="done"
              />
            </View>
            <Divider />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Round-up Savings</Text>
                <Text style={styles.toggleSub}>Auto-save spare change from purchases</Text>
              </View>
              <Switch
                value={state.roundUpEnabled}
                onValueChange={toggleRoundUp}
                trackColor={{ true: MK.fillOrange, false: MK.border }}
                thumbColor="#fff"
              />
            </View>
            <Divider />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Emergency Mode</Text>
                <Text style={styles.toggleSub}>Restrict spending to essentials</Text>
              </View>
              <Switch
                value={state.emergencyMode}
                onValueChange={toggleEmergencyMode}
                trackColor={{ true: '#B45309', false: MK.border }}
                thumbColor="#fff"
              />
            </View>
          </MkCard>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <MkCard>
            <View style={styles.aboutRow}>
              <Info size={18} color={MK.textSecondary} />
              <Text style={styles.aboutLabel}>Maokoto</Text>
              <Text style={styles.aboutVersion}>v1.0.0</Text>
            </View>
            <Divider />
            <View style={styles.aboutRow}>
              <Globe size={18} color={MK.textSecondary} />
              <Text style={styles.aboutLabel}>hello@maokoto.app</Text>
            </View>
          </MkCard>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: MK.textExpense }]}>Danger zone</Text>
          <MkCard>
            <TouchableOpacity style={styles.dangerRow} onPress={handleClearData} activeOpacity={0.7}>
              <Trash2 size={18} color={MK.textExpense} />
              <Text style={styles.dangerText}>Clear all data</Text>
            </TouchableOpacity>
          </MkCard>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Maokoto · Built for East Africa 🌍</Text>
        </View>

        <View style={{ height: 40 }} />
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
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '500', color: MK.textSecondary, paddingHorizontal: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  inputLabel: { fontSize: 14, color: MK.textPrimary, flex: 1 },
  inlineInput: { flex: 1, fontSize: 14, color: MK.textPrimary },
  inlineInputRight: { fontSize: 14, color: MK.textPrimary, textAlign: 'right', minWidth: 80 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  optionFlag: { fontSize: 20 },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: MK.fillOrange },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  toggleSub: { fontSize: 12, color: MK.textSecondary, marginTop: 2 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  aboutLabel: { flex: 1, fontSize: 14, color: MK.textPrimary },
  aboutVersion: { fontSize: 13, color: MK.textSecondary },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  dangerText: { fontSize: 14, fontWeight: '500', color: MK.textExpense },
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerText: { fontSize: 12, color: MK.textSecondary },
});
