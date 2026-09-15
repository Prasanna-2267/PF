import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { font } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

export function ProfileShortcut({ inverted = false }: { inverted?: boolean }) {
  const router = useRouter(); const { theme } = useAppTheme(); const name = useAuthStore((state) => state.user?.name ?? 'Parallax User');
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/account')} style={({ pressed }) => [styles.shell, { borderColor: inverted ? 'rgba(185,199,255,0.48)' : theme.lineStrong }, pressed && styles.pressed]}><LinearGradient colors={inverted ? ['#29365F', '#11172A'] : [theme.primarySoft, theme.surface]} style={styles.avatar}><Text style={[styles.text, { color: inverted ? '#E1E7FF' : theme.primaryStrong }]}>{initials}</Text></LinearGradient><View style={[styles.presence, { borderColor: theme.canvas }]} /></Pressable>;
}

const styles = StyleSheet.create({ shell: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, padding: 2, backgroundColor: 'rgba(8,10,14,.9)' }, avatar: { flex: 1, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, text: { fontFamily: font.bold, fontSize: 11, letterSpacing: .3 }, presence: { position: 'absolute', right: -1, bottom: 2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: '#79DFAF' }, pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] } });
