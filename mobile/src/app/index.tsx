import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { font, radius, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  return <View style={styles.canvas}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.safe}>
      <View style={styles.phone}>
        <LinearGradient colors={['#D79435', '#8D4A22', '#2A1713', '#080A0E', '#050609']} locations={[0, .25, .47, .66, 1]} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.artwork}>
          <View style={styles.warmGlow} />
          <View style={[styles.glassTile, styles.tileOne]} />
          <View style={[styles.glassTile, styles.tileTwo]} />
          <View style={[styles.glassTile, styles.tileThree]} />
          <View style={styles.horizonOne} />
          <View style={styles.horizonTwo} />
          <View style={styles.starField}><View style={styles.star} /><View style={[styles.star, styles.starTwo]} /><View style={[styles.star, styles.starThree]} /></View>
        </View>

        <View style={styles.topBar}>
          <View style={styles.miniBrand}><View style={styles.miniEye}><View style={styles.miniPupil} /></View><Text style={styles.miniBrandText}>PARALLAX FLOW</Text></View>
          <View style={styles.securePill}><ShieldCheck size={12} color="#F2C76D" /><Text style={styles.secureText}>FOCUS SECURED</Text></View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.content}>
          <View style={styles.logoMark}><View style={styles.logoOrbit}><View style={styles.logoPupil} /></View><View style={styles.logoSlash} /></View>
          <Text style={styles.eyebrow}>YOUR LEARNING, IN FLOW</Text>
          <Text style={styles.title}>Study with clarity.{`\n`}Move with purpose.</Text>
          <Text style={styles.description}>One focused space for protected notes, deliberate practice and exam-ready momentum.</Text>

          <View style={styles.valueRow}>
            <View style={styles.valueItem}><BookOpenCheck size={13} color="#F5C96A" /><Text style={styles.valueText}>Focused learning</Text></View>
            <View style={styles.valueDot} />
            <View style={styles.valueItem}><Sparkles size={13} color="#F5C96A" /><Text style={styles.valueText}>Visible progress</Text></View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/signup')} style={({ pressed }) => [styles.primaryShell, pressed && styles.pressed]}>
            <LinearGradient colors={['#FF6B35', '#FFB14A', '#F8E85A']} start={{ x: 0, y: .5 }} end={{ x: 1, y: .5 }} style={styles.primaryButton}><Text style={styles.primaryText}>Start learning</Text><View style={styles.arrowWell}><ArrowRight size={17} color="#18120B" /></View></LinearGradient>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>I already have an account</Text></Pressable>
          <Text style={styles.legal}>Private by design · Built for consistent learners</Text>
        </View>
      </View>
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#08090C' }, safe: { flex: 1 }, phone: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', overflow: 'hidden' },
  artwork: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }, warmGlow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, top: -130, left: -95, backgroundColor: 'rgba(255,196,76,.18)' },
  glassTile: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(44,19,14,.24)', backgroundColor: 'rgba(255,203,106,.035)', borderRadius: 35 }, tileOne: { width: 290, height: 178, top: -60, left: -78, transform: [{ rotate: '-20deg' }] }, tileTwo: { width: 270, height: 190, top: 46, right: -112, transform: [{ rotate: '24deg' }] }, tileThree: { width: 260, height: 150, top: 198, left: 34, transform: [{ rotate: '12deg' }] },
  horizonOne: { position: 'absolute', width: 660, height: 210, borderRadius: 330, borderWidth: 1, borderColor: 'rgba(238,177,77,.12)', left: -120, top: 285, transform: [{ rotate: '-4deg' }] }, horizonTwo: { position: 'absolute', width: 570, height: 175, borderRadius: 285, borderWidth: 1, borderColor: 'rgba(255,255,255,.055)', left: -75, top: 324 },
  starField: { position: 'absolute', top: 284, right: 56 }, star: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#F8D47D' }, starTwo: { position: 'absolute', top: 51, right: 42, opacity: .45 }, starThree: { position: 'absolute', top: 105, right: -8, opacity: .28 },
  topBar: { minHeight: 58, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, miniBrand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, miniEye: { width: 24, height: 15, borderWidth: 1.7, borderColor: 'rgba(255,255,255,.86)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, miniPupil: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2C76D' }, miniBrandText: { color: 'rgba(255,255,255,.88)', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, securePill: { minHeight: 27, paddingHorizontal: 9, borderWidth: 1, borderColor: 'rgba(242,199,109,.24)', borderRadius: radius.pill, backgroundColor: 'rgba(10,11,14,.24)', flexDirection: 'row', alignItems: 'center', gap: 5 }, secureText: { color: '#F2C76D', fontFamily: font.bold, fontSize: 6, letterSpacing: .65 },
  spacer: { flex: 1, minHeight: 190 }, content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  logoMark: { width: 45, height: 38, marginBottom: 14, justifyContent: 'center' }, logoOrbit: { width: 37, height: 23, borderWidth: 4, borderColor: '#FFFFFF', borderRadius: 19, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }] }, logoPupil: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#F4C762' }, logoSlash: { position: 'absolute', width: 8, height: 34, borderRadius: 5, backgroundColor: '#FFFFFF', right: 5, transform: [{ rotate: '36deg' }] },
  eyebrow: { color: '#F4C762', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.4 }, title: { marginTop: 8, color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 31, lineHeight: 37, letterSpacing: -1 }, description: { maxWidth: 390, marginTop: 10, color: '#ADB2BC', fontFamily: font.regular, fontSize: 12, lineHeight: 19 },
  valueRow: { minHeight: 39, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, valueItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, valueText: { color: '#D6D8DD', fontFamily: font.semibold, fontSize: 8 }, valueDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#5E6169' },
  primaryShell: { marginTop: 12, borderRadius: 16, shadowColor: '#FF9A3D', shadowOpacity: .24, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 6 }, primaryButton: { minHeight: 55, borderRadius: 16, paddingLeft: 18, paddingRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 13 }, arrowWell: { width: 39, height: 39, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.38)', alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { minHeight: 49, marginTop: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', borderRadius: 15, backgroundColor: 'rgba(9,10,13,.58)', alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#D5D7DC', fontFamily: font.bold, fontSize: 11 }, legal: { marginTop: 11, color: '#666B74', fontFamily: font.medium, fontSize: 7.5, textAlign: 'center' }, pressed: { opacity: .82, transform: [{ scale: .99 }] },
});
