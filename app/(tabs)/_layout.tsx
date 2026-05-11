import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, PieChart, Target, TrendingUp, Wallet } from 'lucide-react-native';
import { MK } from '@/lib/theme';

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={20} color={focused ? MK.fillOrange : '#A6A4A0'} strokeWidth={focused ? 2.2 : 1.8} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: MK.fillOrange,
        tabBarInactiveTintColor: '#A6A4A0',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={PieChart} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Target} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={TrendingUp} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Wallet} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#F0EFED',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MK.radiusSm,
  },
  iconWrapActive: {
    backgroundColor: '#FFF1E8',
  },
});
