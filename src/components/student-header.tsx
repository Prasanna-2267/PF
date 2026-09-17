import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye } from 'lucide-react-native';
import { font } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

export function StudentHeader() {
  const { theme } = useAppTheme(); const router = useRouter();
  return <LinearGradient colors={['#090B0D', '#111518']} style={[styles.header, { borderBottomColor: theme.line }]}><View style={styles.brand}><View style={[styles.brandMark, { backgroundColor: theme.primarySoft }]}><Eye size={22} strokeWidth={2.5} color={theme.primary} /></View><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.wordmark, { color: theme.fg }]}>Parallax Flow</Text></View><View style={styles.actions}><Pressable accessibilityLabel="Account" onPress={() => router.push('/account')} style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><Text style={[styles.avatarText, { color: theme.primaryStrong }]}>PA</Text></Pressable></View></LinearGradient>;
}
const styles = StyleSheet.create({ header: { height: 64, borderBottomWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#10162F', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 7 }, brandMark: { height: 31, width: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, wordmark: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 19, letterSpacing: -0.55 }, actions: { flexDirection: 'row', gap: 8, alignItems: 'center' }, themeButton: { height: 46, width: 46, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, avatar: { height: 43, width: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.bold, fontSize: 15 } });
