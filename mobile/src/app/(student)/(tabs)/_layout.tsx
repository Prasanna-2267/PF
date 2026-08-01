import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BookOpen, ChartLine, CircleDot, House, Library } from 'lucide-react-native';
import { StudentHeader } from '@/components/student-header';
import { font } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

const icons = { home: House, notes: BookOpen, practice: CircleDot, tracker: ChartLine, library: Library };
export default function StudentTabs() { const { theme } = useAppTheme(); return <Tabs screenOptions={({ route }) => { const Icon = icons[route.name as keyof typeof icons]; return { header: () => <StudentHeader />, tabBarStyle: [styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.line }], tabBarActiveTintColor: theme.primary, tabBarInactiveTintColor: theme.muted, tabBarLabelStyle: styles.label, tabBarIcon: ({ color, focused }) => <View style={[styles.iconBubble, focused && { backgroundColor: theme.primary }]}><Icon size={24} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 2.5 : 2} /></View> }; }}>
  <Tabs.Screen name="home" options={{ title: 'Home' }} /><Tabs.Screen name="notes" options={{ title: 'Notes' }} /><Tabs.Screen name="practice" options={{ title: 'Practice' }} /><Tabs.Screen name="tracker" options={{ title: 'Tracker' }} /><Tabs.Screen name="library" options={{ title: 'Library' }} />
</Tabs>; }
const styles = StyleSheet.create({ bar: { height: 66, paddingTop: 4, paddingBottom: 5, borderTopWidth: 1 }, label: { fontFamily: font.semibold, fontSize: 10, marginTop: 0 }, iconBubble: { width: 47, height: 28, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } });
