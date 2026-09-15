import { Tabs } from 'expo-router';
import { LiquidTabBar } from '@/components/liquid-tab-bar';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentTabs() { const academyStudent = useAuthStore((state) => Boolean(state.user?.academyId)); return <Tabs detachInactiveScreens={false} tabBar={(props) => <LiquidTabBar {...props} />} screenOptions={{ headerShown: false, animation: 'none', lazy: false }}>
  <Tabs.Screen name="home" options={{ title: 'Home' }} /><Tabs.Screen name="notes" options={{ title: 'Notes' }} /><Tabs.Screen name="practice" options={{ title: 'Practice' }} /><Tabs.Screen name="tracker" options={{ title: 'Tracker' }} /><Tabs.Screen name="library" options={{ title: 'Library', href: academyStudent ? null : undefined }} />
</Tabs>; }
