import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { font } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

export function ProfileShortcut({ inverted = false }: { inverted?: boolean }) {
  const router = useRouter(); const { theme } = useAppTheme(); const name = useAuthStore((state) => state.user?.name ?? 'Parallax User');
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/account')} style={({ pressed }) => [styles.avatar, { backgroundColor: inverted ? 'rgba(124,156,255,0.18)' : theme.primarySoft, borderColor: inverted ? 'rgba(185,199,255,0.48)' : theme.line }, pressed && styles.pressed]}><Text style={[styles.text, { color: inverted ? '#E1E7FF' : theme.primaryStrong }]}>{initials}</Text></Pressable>;
}

const styles = StyleSheet.create({ avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, text: { fontFamily: font.bold, fontSize: 12 }, pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] } });
