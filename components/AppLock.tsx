import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Delete, X } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';
import { verifyPin } from '@/lib/AppContext';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

interface Props {
  mode: 'unlock' | 'setup';
  onClose?: () => void;
  onUnlocked?: () => void;
}

export default function AppLock({ mode, onClose, onUnlocked }: Props) {
  const { state, setAppLockPin, disableAppLock } = useApp();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');

  const handleKey = async (key: string) => {
    if (key === '⌫') {
      if (step === 'enter') setPin(p => p.slice(0, -1));
      else setConfirmPin(p => p.slice(0, -1));
      return;
    }
    if (key === '') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mode === 'unlock') {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) {
        if (verifyPin(next, state.appLockPin)) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUnlocked?.();
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError('Incorrect PIN');
          setPin('');
        }
      }
      return;
    }

    // Setup mode
    if (step === 'enter') {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) {
        setStep('confirm');
      }
    } else {
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === pin) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setAppLockPin(pin);
          Alert.alert('PIN set', 'App lock is now enabled.', [{ text: 'OK', onPress: onClose }]);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError('PINs do not match');
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    }
  };

  const currentPin = step === 'confirm' ? confirmPin : pin;
  const title = mode === 'unlock'
    ? 'Enter PIN'
    : step === 'enter' ? 'Set a 4-digit PIN' : 'Confirm PIN';

  return (
    <SafeAreaView style={styles.safe}>
      {onClose && (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X size={20} color={MK.textSecondary} />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Dots */}
        <View style={styles.dots}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[styles.dot, i < currentPin.length && styles.dotFilled]} />
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYS.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.key, key === '' && styles.keyEmpty]}
              onPress={() => handleKey(key)}
              disabled={key === ''}
              activeOpacity={0.7}
            >
              {key === '⌫'
                ? <Delete size={20} color={MK.textPrimary} />
                : <Text style={styles.keyText}>{key}</Text>
              }
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'setup' && state.appLockEnabled && (
          <TouchableOpacity onPress={() => { disableAppLock(); onClose?.(); }}>
            <Text style={styles.disableText}>Disable App Lock</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  closeBtn: { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 40 },
  logo: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: MK.fillOrange, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  title: { fontSize: 18, fontWeight: '600', color: MK.textPrimary },
  error: { fontSize: 14, color: MK.textExpense, fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 16 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: MK.border, backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: MK.fillOrange, borderColor: MK.fillOrange },
  keypad: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: MK.fillSecondary, alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent' },
  keyText: { fontSize: 24, fontWeight: '500', color: MK.textPrimary },
  disableText: { fontSize: 14, color: MK.textExpense, fontWeight: '500' },
});
