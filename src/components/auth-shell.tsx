import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, radius, spacing, themes } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

const ambientDots = Array.from({ length: 24 }, (_, index) => index);

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <LinearGradient pointerEvents="none" colors={dark ? ['#1A2842', '#101827', '#090B0D'] : ['#EEF2FF', '#F7F8FC', '#F7F8FB']} locations={[0, .46, 1]} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" accessibilityElementsHidden style={styles.ambient}>
      <View style={[styles.orbitLarge, { borderColor: dark ? 'rgba(124,156,255,.15)' : 'rgba(70,84,163,.12)' }]}><View style={[styles.orbitSatellite, { backgroundColor: theme.goldStrong }]} /></View>
      <View style={[styles.orbitSmall, { borderColor: dark ? 'rgba(240,200,120,.13)' : 'rgba(179,138,74,.14)' }]} />
      <LinearGradient colors={dark ? ['rgba(124,156,255,.17)', 'rgba(124,156,255,0)'] : ['rgba(70,84,163,.12)', 'rgba(70,84,163,0)']} style={styles.ambientGlow} />
      <View style={styles.dotField}>{ambientDots.map((dot) => <View key={dot} style={[styles.dot, { backgroundColor: dot % 5 === 0 ? theme.goldStrong : theme.primaryStrong, opacity: dot % 4 === 0 ? .32 : .13 }]} />)}</View>
    </View>

    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.brandBar, { backgroundColor: dark ? 'rgba(20,30,48,.78)' : 'rgba(255,255,255,.76)', borderColor: dark ? 'rgba(185,199,255,.22)' : 'rgba(255,255,255,.96)' }]}>
          <View style={styles.brand}><View style={[styles.eyeHalo, { backgroundColor: theme.primarySoft }]}><View style={[styles.eye, { borderColor: theme.primaryStrong }]}><View style={[styles.pupil, { backgroundColor: theme.goldStrong }]} /></View></View><View><Text style={[styles.wordmark, { color: theme.fg }]}>parallax<Text style={{ color: theme.goldStrong }}>flow</Text></Text><Text style={[styles.brandCaption, { color: theme.muted }]}>LEARN WITH INTENT</Text></View></View>
          <View style={[styles.securePill, { backgroundColor: theme.successSoft, borderColor: dark ? 'rgba(103,214,167,.22)' : theme.line }]}><ShieldCheck size={13} color={theme.success} /><Text style={[styles.secureText, { color: theme.success }]}>SECURE</Text></View>
        </View>

        <View style={styles.heading}>
          <View style={styles.eyebrowRow}><View style={[styles.eyebrowMark, { backgroundColor: theme.goldSoft }]}><Sparkles size={13} color={theme.goldStrong} /></View><Text style={[styles.eyebrow, { color: theme.goldStrong }]}>{eyebrow}</Text><View style={[styles.eyebrowLine, { backgroundColor: theme.lineStrong }]} /></View>
          <Text style={[styles.title, { color: theme.fg }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
        </View>

        <View style={styles.form}>{children}</View>
        {footer ? <View style={[styles.footer, { backgroundColor: dark ? 'rgba(20,23,27,.72)' : 'rgba(255,255,255,.72)', borderColor: theme.line }]}>{footer}</View> : null}
        <Text style={[styles.legal, { color: theme.faint }]}>Protected learning · Private progress · Built for focus</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function AuthLink({ children, onPress }: { children: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={({ pressed }) => pressed && styles.linkPressed}><Text style={[styles.link, { color: theme.primaryStrong }]}>{children}</Text></Pressable>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1 },
  ambient: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  orbitLarge: { position: 'absolute', width: 310, height: 310, borderRadius: 155, borderWidth: 1, right: -175, top: -104 }, orbitSatellite: { position: 'absolute', width: 9, height: 9, borderRadius: 5, left: 48, bottom: 42 },
  orbitSmall: { position: 'absolute', width: 172, height: 172, borderRadius: 86, borderWidth: 1, left: -105, top: 310 }, ambientGlow: { position: 'absolute', width: 260, height: 320, right: -100, top: 100, borderRadius: 130, transform: [{ rotate: '-18deg' }] },
  dotField: { position: 'absolute', width: 130, right: -3, top: 208, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, dot: { width: 3, height: 3, borderRadius: 2 },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  brandBar: { minHeight: 68, borderWidth: 1, borderRadius: 21, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, overflow: 'hidden' },
  brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 }, eyeHalo: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, eye: { width: 25, height: 16, borderWidth: 2.4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, pupil: { width: 7, height: 7, borderRadius: 4 },
  wordmark: { fontFamily: font.extraBold, fontSize: 20, lineHeight: 23, letterSpacing: -1 }, brandCaption: { marginTop: 1, fontFamily: font.bold, fontSize: 6, letterSpacing: 1.25 },
  securePill: { minHeight: 27, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, secureText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .65 },
  heading: { marginTop: 37 }, eyebrowRow: { height: 24, flexDirection: 'row', alignItems: 'center', gap: 7 }, eyebrowMark: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.45 }, eyebrowLine: { flex: 1, height: 1, opacity: .62 },
  title: { maxWidth: 430, marginTop: 10, fontFamily: font.extraBold, fontSize: 34, lineHeight: 41, letterSpacing: -1.1 }, description: { maxWidth: 430, marginTop: 7, fontFamily: font.regular, fontSize: 13, lineHeight: 20 },
  form: { marginTop: spacing.xl, gap: spacing.md },
  footer: { minHeight: 54, marginTop: spacing.lg, borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  legal: { marginTop: 14, fontFamily: font.medium, fontSize: 8, letterSpacing: .25, textAlign: 'center' },
  link: { fontFamily: font.bold, fontSize: 12 }, linkPressed: { opacity: .65 },
});
