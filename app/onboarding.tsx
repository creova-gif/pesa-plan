import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp, type Language, type UserType, type IncomeFrequency } from '@/lib/AppContext';
import { REGION_CONFIG, type Region } from '@/utils/currency';
import { MK } from '@/lib/theme';

const { width: W } = Dimensions.get('window');
const TOTAL_STEPS = 6;

// ── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            backgroundColor: i <= current ? MK.fillOrange : MK.border,
          }}
        />
      ))}
    </View>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────
function OptionCard({
  selected, onPress, children, style,
}: {
  selected: boolean; onPress: () => void; children: React.ReactNode; style?: object;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.optionCard, selected && styles.optionCardSelected, style]}
    >
      {children}
      {selected && (
        <View style={styles.checkBadge}>
          <Check size={11} color="#fff" strokeWidth={2.5} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Welcome (Step 0) ──────────────────────────────────────────────────────
function WelcomeStep({ onNext, lang }: { onNext: () => void; lang: Language }) {
  const features = [
    { icon: '📲', en: 'M-Pesa · Airtel · Tigo', sub: { en: 'All mobile money', sw: 'Pesa za simu zote' }, sw: 'M-Pesa · Airtel · Tigo' },
    { icon: '📊', en: 'AI Budgeting', sub: { en: 'Smart insights', sw: 'Akili bandia' }, sw: 'Bajeti ya AI' },
    { icon: '🔒', en: '100% Private', sub: { en: 'Data on your device', sw: 'Data kwenye simu' }, sw: 'Faragha Kamili' },
  ];
  const isEn = lang === 'en';
  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Text style={{ fontSize: 36 }}>💰</Text>
        </View>
      </View>
      <Text style={styles.appName}>Maokoto</Text>
      <Text style={styles.tagline}>
        {isEn ? 'Control your money, without fear' : 'Dhibiti pesa zako, usiogope'}
      </Text>

      <View style={{ gap: 10, width: '100%', marginBottom: 32 }}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={{ fontSize: 20 }}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{isEn ? f.en : f.sw}</Text>
              <Text style={styles.featureSub}>{isEn ? f.sub.en : f.sub.sw}</Text>
            </View>
            <View style={styles.smallCheck}>
              <Check size={11} color={MK.fillGreen} strokeWidth={2.5} />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.ctaBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>{isEn ? 'Get Started' : 'Anza Sasa'}</Text>
      </TouchableOpacity>
      <Text style={styles.footerNote}>
        {isEn ? 'Free · No ads · Works offline' : 'Bila malipo · Bila matangazo · Bila mtandao'}
      </Text>
    </ScrollView>
  );
}

// ── Language (Step 1) ─────────────────────────────────────────────────────
function LanguageStep({ onPick }: { onPick: (l: Language) => void }) {
  const [picked, setPicked] = useState<Language | null>(null);
  const options = [
    { code: 'sw' as Language, name: 'Kiswahili', flag: '🇹🇿', sub: 'Lugha ya Afrika Mashariki' },
    { code: 'en' as Language, name: 'English',   flag: '🇬🇧', sub: 'International language' },
    { code: 'fr' as Language, name: 'Français',  flag: '🇫🇷', sub: 'Pour les francophones' },
  ];
  const handle = (l: Language) => {
    setPicked(l);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => onPick(l), 300);
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Habari? / Hello!</Text>
      <Text style={styles.stepSub}>Choose your language</Text>
      <View style={{ gap: 10, width: '100%' }}>
        {options.map(l => (
          <OptionCard key={l.code} selected={picked === l.code} onPress={() => handle(l.code)}>
            <Text style={{ fontSize: 32, marginRight: 12 }}>{l.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{l.name}</Text>
              <Text style={styles.optionSub}>{l.sub}</Text>
            </View>
          </OptionCard>
        ))}
      </View>
    </View>
  );
}

// ── Name (Step 2) ─────────────────────────────────────────────────────────
function NameStep({ onNext, lang, initial }: { onNext: (n: string) => void; lang: Language; initial: string }) {
  const [name, setName] = useState(initial);
  const isEn = lang === 'en';
  const display = name.trim() || (isEn ? 'Friend' : 'Rafiki');
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.stepContainer}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>👋</Text>
        <Text style={styles.stepTitle}>{isEn ? "What's your name?" : 'Jina lako ni nani?'}</Text>
        <Text style={styles.stepSub}>{isEn ? "We'd love to greet you personally" : 'Tunataka kukusalimu vizuri'}</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: MK.fillGreen, marginBottom: 20 }}>
          {isEn ? `Hi, ${display}!` : `Karibu, ${display}!`}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={isEn ? 'Type your name...' : 'Andika jina lako...'}
          placeholderTextColor={MK.textSecondary}
          maxLength={30}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={() => onNext(name.trim())}
        />
        <Text style={{ fontSize: 12, color: MK.textSecondary, marginTop: 6 }}>
          {isEn ? 'Or continue without a name' : 'Au bonyeza Endelea bila jina'}
        </Text>
        <TouchableOpacity style={[styles.ctaBtn, { marginTop: 24 }]} onPress={() => onNext(name.trim())} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>{isEn ? 'Continue' : 'Endelea'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Region (Step 3) ───────────────────────────────────────────────────────
const REGIONS: Region[] = ['TZ', 'KE', 'UG', 'RW', 'BI'];
function RegionStep({ onPick, lang }: { onPick: (r: Region) => void; lang: Language }) {
  const [picked, setPicked] = useState<Region | null>(null);
  const isEn = lang === 'en';
  const handle = (r: Region) => {
    setPicked(r);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => onPick(r), 300);
  };
  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{isEn ? 'Where are you?' : 'Uko wapi?'}</Text>
      <Text style={styles.stepSub}>{isEn ? "We'll set the right currency" : 'Tutapanga sarafu sahihi'}</Text>
      <View style={{ gap: 8, width: '100%' }}>
        {REGIONS.map(code => {
          const cfg = REGION_CONFIG[code];
          return (
            <OptionCard key={code} selected={picked === code} onPress={() => handle(code)}>
              <Text style={{ fontSize: 28, marginRight: 12 }}>{cfg.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{isEn ? cfg.nameEn : cfg.nameSw}</Text>
                <Text style={styles.optionSub}>{cfg.currency} · {cfg.symbol}</Text>
              </View>
            </OptionCard>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── User Type (Step 4) ────────────────────────────────────────────────────
const USER_TYPES = [
  { type: 'student'  as UserType, emoji: '🎓', en: 'Student / Youth',  sw: 'Mwanafunzi' },
  { type: 'biashara' as UserType, emoji: '🏪', en: 'Business owner',   sw: 'Biashara' },
  { type: 'informal' as UserType, emoji: '🔧', en: 'Informal worker',  sw: 'Kazi ya Kawaida' },
  { type: 'family'   as UserType, emoji: '🏠', en: 'Family planner',   sw: 'Familia' },
  { type: 'other'    as UserType, emoji: '✨', en: 'Other',            sw: 'Nyingine' },
];
function UserTypeStep({ onPick, lang }: { onPick: (t: UserType) => void; lang: Language }) {
  const [picked, setPicked] = useState<UserType | null>(null);
  const isEn = lang === 'en';
  const handle = (t: UserType) => {
    setPicked(t);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => onPick(t), 300);
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{isEn ? 'Who are you?' : 'Nani wewe?'}</Text>
      <Text style={styles.stepSub}>{isEn ? 'We personalise your experience' : 'Tunaboresha uzoefu wako'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' }}>
        {USER_TYPES.map(({ type, emoji, en, sw }) => (
          <OptionCard
            key={type}
            selected={picked === type}
            onPress={() => handle(type)}
            style={{ width: type === 'other' ? '100%' : '47%', minHeight: 90 }}
          >
            <View style={{ flex: 1, padding: 4 }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</Text>
              <Text style={[styles.optionTitle, { fontSize: 13 }]}>{isEn ? en : sw}</Text>
            </View>
          </OptionCard>
        ))}
      </View>
    </View>
  );
}

// ── Income Frequency (Step 5) ─────────────────────────────────────────────
const FREQS = [
  { freq: 'daily'     as IncomeFrequency, emoji: '☀️', en: 'Daily income',   sw: 'Mapato ya kila siku',   tagEn: 'Every day',   tagSw: 'Kila siku' },
  { freq: 'weekly'    as IncomeFrequency, emoji: '📅', en: 'Weekly income',  sw: 'Mapato ya kila wiki',   tagEn: 'Every week',  tagSw: 'Kila wiki' },
  { freq: 'monthly'   as IncomeFrequency, emoji: '💼', en: 'Monthly salary', sw: 'Mshahara wa mwezi',     tagEn: 'Monthly',     tagSw: 'Kila mwezi' },
  { freq: 'irregular' as IncomeFrequency, emoji: '🔀', en: 'Irregular',      sw: 'Mchanganyiko',          tagEn: 'Varies',      tagSw: 'Hutofautiana' },
];
function IncomeStep({ onPick, lang }: { onPick: (f: IncomeFrequency) => void; lang: Language }) {
  const [picked, setPicked] = useState<IncomeFrequency | null>(null);
  const isEn = lang === 'en';
  const handle = (f: IncomeFrequency) => {
    setPicked(f);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => onPick(f), 300);
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{isEn ? 'How do you earn?' : 'Unapata pesa vipi?'}</Text>
      <Text style={styles.stepSub}>{isEn ? 'Helps forecast your cash flow' : 'Inasaidia kutabiri pesa'}</Text>
      <View style={{ gap: 8, width: '100%' }}>
        {FREQS.map(({ freq, emoji, en, sw, tagEn, tagSw }) => (
          <OptionCard key={freq} selected={picked === freq} onPress={() => handle(freq)}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{isEn ? en : sw}</Text>
            </View>
            <View style={[styles.tag, picked === freq && styles.tagActive]}>
              <Text style={[styles.tagText, picked === freq && { color: MK.fillOrange }]}>
                {isEn ? tagEn : tagSw}
              </Text>
            </View>
          </OptionCard>
        ))}
      </View>
    </View>
  );
}

// ── Goal Setup (Step 6) ───────────────────────────────────────────────────
const GOAL_OPTS = [
  { id: 'schoolFees', emoji: '🎓', en: 'School fees', sw: 'Ada za shule' },
  { id: 'bills',      emoji: '💡', en: 'Bills & rent', sw: 'Bili na kodi' },
  { id: 'emergency',  emoji: '🛡️', en: 'Emergency fund', sw: 'Akiba ya dharura' },
  { id: 'data',       emoji: '📱', en: 'Data & airtime', sw: 'Data na muda' },
  { id: 'travel',     emoji: '✈️', en: 'Travel', sw: 'Safari' },
  { id: 'custom',     emoji: '⭐', en: 'My own goal', sw: 'Lengo langu' },
];
function GoalStep({ onDone, lang }: { onDone: (title: string, amount: number) => void; lang: Language }) {
  const [goalId, setGoalId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const isEn = lang === 'en';
  const selected = GOAL_OPTS.find(g => g.id === goalId);

  const submit = () => {
    const num = parseInt(amount);
    if (!goalId) { setError(isEn ? 'Pick a goal first' : 'Chagua lengo kwanza'); return; }
    if (!amount || isNaN(num) || num < 100) { setError(isEn ? 'Enter a valid amount (min 100)' : 'Ingiza kiasi halali (min 100)'); return; }
    onDone(isEn ? selected!.en : selected!.sw, num);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{isEn ? 'Your first goal' : 'Lengo lako la kwanza'}</Text>
        <Text style={styles.stepSub}>{isEn ? "Let's start your savings journey!" : 'Tuanze safari ya kuokoa!'}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 16 }}>
          {GOAL_OPTS.map(({ id, emoji, en, sw }) => (
            <TouchableOpacity
              key={id}
              onPress={() => { setGoalId(id); setError(''); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.8}
              style={[styles.goalChip, goalId === id && styles.goalChipSelected]}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</Text>
              <Text style={[styles.goalChipText, goalId === id && { color: MK.fillOrange }]}>
                {isEn ? en : sw}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {goalId && (
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{isEn ? 'Target amount' : 'Kiasi cha lengo'}</Text>
            <TextInput
              value={amount}
              onChangeText={v => { setAmount(v); setError(''); }}
              placeholder="0"
              placeholderTextColor={MK.textSecondary}
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.ctaBtn, !goalId && { backgroundColor: MK.border }]}
          onPress={submit}
          activeOpacity={0.85}
          disabled={!goalId}
        >
          <Text style={[styles.ctaBtnText, !goalId && { color: MK.textSecondary }]}>
            {isEn ? 'Start Saving' : 'Anza Kuokoa'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDone(isEn ? 'My Goal' : 'Lengo Langu', 10000)}>
          <Text style={[styles.footerNote, { marginTop: 8 }]}>{isEn ? 'Skip for now' : 'Ruka kwa sasa'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Main OnboardingFlow ───────────────────────────────────────────────────
export default function Onboarding() {
  const { state, setLanguage, setRegion, setUserType, setIncomeFrequency, setFirstGoal, setUserName, completeOnboarding } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pendingName, setPendingName] = useState('');

  const lang = state.language;
  const showBack = step > 0;
  const showProgress = step >= 1;
  const progressStep = Math.max(0, step - 1);

  const next = (s: number) => setStep(s);

  const handleGoal = (title: string, amount: number) => {
    setFirstGoal({ id: '1', title, target: amount, current: 0, completed: false });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }}>
          {showBack && (
            <TouchableOpacity
              onPress={() => setStep(s => Math.max(0, s - 1))}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={MK.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
        {showProgress && (
          <View style={{ flex: 1 }}>
            <ProgressBar total={TOTAL_STEPS} current={progressStep} />
          </View>
        )}
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {step === 0 && <WelcomeStep onNext={() => next(1)} lang={lang} />}
        {step === 1 && <LanguageStep onPick={l => { setLanguage(l); next(2); }} />}
        {step === 2 && <NameStep onNext={n => { setPendingName(n); if (n) setUserName(n); next(3); }} lang={lang} initial={pendingName} />}
        {step === 3 && <RegionStep onPick={r => { setRegion(r); next(4); }} lang={lang} />}
        {step === 4 && <UserTypeStep onPick={t => { setUserType(t); next(5); }} lang={lang} />}
        {step === 5 && <IncomeStep onPick={f => { setIncomeFrequency(f); next(6); }} lang={lang} />}
        {step === 6 && <GoalStep onDone={handleGoal} lang={lang} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8, minHeight: 72 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center' },
  stepContainer: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 32, gap: 8 },
  logoWrap: { marginBottom: 20 },
  logo: { width: 88, height: 88, borderRadius: 26, backgroundColor: MK.fillGreen, alignItems: 'center', justifyContent: 'center', shadowColor: MK.fillGreen, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  appName: { fontSize: 40, fontWeight: '700', color: MK.textPrimary, letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 15, color: MK.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: MK.fillSecondary, borderRadius: 14, padding: 14, width: '100%', borderWidth: 1, borderColor: MK.border },
  featureTitle: { fontSize: 14, fontWeight: '500', color: MK.textPrimary },
  featureSub: { fontSize: 12, color: MK.textSecondary, marginTop: 1 },
  smallCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(78,136,111,0.12)', alignItems: 'center', justifyContent: 'center' },
  ctaBtn: { width: '100%', backgroundColor: MK.fillOrange, borderRadius: 999, paddingVertical: 16, alignItems: 'center', shadowColor: MK.fillOrange, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerNote: { fontSize: 12, color: MK.textSecondary, textAlign: 'center', marginTop: 10 },
  stepTitle: { fontSize: 26, fontWeight: '700', color: MK.textPrimary, textAlign: 'center', marginBottom: 4 },
  stepSub: { fontSize: 14, color: MK.textSecondary, textAlign: 'center', marginBottom: 20 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1.5, borderColor: MK.border, width: '100%', position: 'relative' },
  optionCardSelected: { borderColor: MK.fillOrange, borderWidth: 2 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: MK.textPrimary },
  optionSub: { fontSize: 12, color: MK.textSecondary, marginTop: 2 },
  checkBadge: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: MK.fillOrange, alignItems: 'center', justifyContent: 'center' },
  input: { width: '100%', backgroundColor: MK.fillSecondary, borderRadius: 16, padding: 16, fontSize: 18, fontWeight: '600', color: MK.textPrimary, borderWidth: 1.5, borderColor: MK.border, textAlign: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: MK.fillSecondary },
  tagActive: { backgroundColor: 'rgba(253,130,64,0.12)' },
  tagText: { fontSize: 11, fontWeight: '500', color: MK.textSecondary },
  goalChip: { width: '31%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: MK.border, alignItems: 'center', justifyContent: 'center', padding: 8 },
  goalChipSelected: { borderColor: MK.fillOrange, borderWidth: 2 },
  goalChipText: { fontSize: 10, fontWeight: '500', color: MK.textSecondary, textAlign: 'center', marginTop: 2 },
  amountBox: { width: '100%', backgroundColor: MK.fillSecondary, borderRadius: 14, padding: 16, marginBottom: 8 },
  amountLabel: { fontSize: 11, fontWeight: '500', color: MK.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  amountInput: { fontSize: 28, fontWeight: '700', color: MK.textPrimary },
  errorText: { color: MK.textExpense, fontSize: 12, alignSelf: 'flex-start' },
});
