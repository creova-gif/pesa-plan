import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/lib/AppContext';
import { MK } from '@/lib/theme';

export default function Index() {
  const { state, loaded } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    if (state.onboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, [loaded, state.onboardingComplete]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={MK.fillOrange} size="large" />
    </View>
  );
}
