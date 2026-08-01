import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand, font, spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  const { theme } = useAppTheme();
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.brand}><View style={styles.eye}><View style={styles.pupil} /></View><Text style={[styles.wordmark, { color: theme.fg }]}>parallax<Text style={{ color: brand.gold500 }}>flow</Text></Text></View>
    <View style={styles.heading}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={[styles.title, { color: theme.fg }]}>{title}</Text><Text style={[styles.description, { color: theme.muted }]}>{description}</Text></View>
    <View style={styles.form}>{children}</View>{footer ? <View style={styles.footer}>{footer}</View> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function AuthLink({ children, onPress }: { children: string; onPress: () => void }) { const { theme } = useAppTheme(); return <Pressable onPress={onPress} hitSlop={8}><Text style={[styles.link, { color: theme.primary }]}>{children}</Text></Pressable>; }
const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1 }, content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxxl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, eye: { width: 31, height: 21, borderWidth: 3, borderColor: brand.indigo600, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, pupil: { width: 8, height: 8, borderRadius: 8, backgroundColor: brand.gold500 }, wordmark: { fontFamily: font.extraBold, fontSize: 22, letterSpacing: -1.1 },
  heading: { marginTop: 54, gap: spacing.sm }, eyebrow: { color: brand.gold600, fontFamily: font.bold, fontSize: 11, letterSpacing: 1.5 }, title: { fontFamily: font.extraBold, fontSize: 31, lineHeight: 39, letterSpacing: -0.9 }, description: { fontFamily: font.regular, fontSize: 14, lineHeight: 21 }, form: { marginTop: spacing.xxxl, gap: spacing.lg }, footer: { marginTop: spacing.xxl, alignItems: 'center' }, link: { fontFamily: font.bold, fontSize: 13 },
});
