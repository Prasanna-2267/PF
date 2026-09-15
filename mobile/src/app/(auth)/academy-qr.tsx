import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { font, spacing } from '@/constants/theme';
import { claimAcademyQr, getAuthErrorMessage, validateAcademyQr } from '@/lib/auth-session';
import { useAuthStore } from '@/lib/auth-store';
import { useSignupDraftStore } from '@/lib/signup-draft-store';

const extractToken = (raw: string) => {
  const value = raw.trim();
  if (value.startsWith('PFQR.')) return value;
  try { return new URL(value).searchParams.get('token') ?? value; } catch { return value; }
};

export default function AcademyQrScreen() {
  const router = useRouter();
  const authenticated = useAuthStore((state) => state.status === 'authenticated' && !state.accessToken?.startsWith('ui-only-'));
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');
  const [academyName, setAcademyName] = useState('');
  const updateSignupDraft = useSignupDraftStore((state) => state.update);

  const processToken = async (raw: string) => {
    if (locked) return;
    const qrToken = extractToken(raw);
    if (!qrToken.startsWith('PFQR.')) { setError('This is not a Parallax Flow Academy QR code.'); return; }
    setLocked(true); setError('');
    try {
      if (authenticated) {
        const result = await claimAcademyQr(qrToken) as { academyName?: string };
        setAcademyName(result.academyName ?? 'Academy');
        setTimeout(() => router.replace('/account'), 900);
      } else {
        const preview = await validateAcademyQr(qrToken);
        setAcademyName(preview.academy.name);
        updateSignupDraft({ admissionProof: preview.admissionProof, academyName: preview.academy.name, academyId: preview.academy.id });
        setTimeout(() => router.back(), 650);
      }
    } catch (reason) { setError(getAuthErrorMessage(reason)); setLocked(false); }
  };
  const onBarcodeScanned = (result: BarcodeScanningResult) => void processToken(result.data);

  return <View style={styles.canvas}><StatusBar style="light" /><LinearGradient colors={['#B86A26', '#3A2019', '#08090C']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color="#fff" size={20} /></Pressable><View><Text style={styles.eyebrow}>ACADEMY ACCESS</Text><Text style={styles.title}>Scan invitation</Text></View><ShieldCheck color="#F6C85F" size={22} /></View>
      <View style={styles.copy}><Text style={styles.copyTitle}>Join the right learning space</Text><Text style={styles.copyText}>Scan the live QR shown by your Academy. We verify the Academy before any account or membership is created.</Text></View>
      <View style={styles.scannerShell}>
        {academyName ? <View style={styles.success}><CheckCircle2 color="#66D7A2" size={58} /><Text style={styles.successTitle}>{academyName}</Text><Text style={styles.successText}>{authenticated ? 'Academy joined. Refreshing your workspace…' : 'Verified. Opening secure account setup…'}</Text></View>
          : permission?.granted && Platform.OS !== 'web' ? <><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={locked ? undefined : onBarcodeScanned} /><View pointerEvents="none" style={styles.scanFrame}><View style={styles.scanLine} /></View></>
          : <View style={styles.permission}><Camera color="#F6C85F" size={45} /><Text style={styles.permissionTitle}>{Platform.OS === 'web' ? 'Use the Academy QR token' : 'Camera access is required'}</Text><Text style={styles.permissionText}>{Platform.OS === 'web' ? 'For browser testing, paste the QR value below.' : 'Parallax Flow uses the camera only while this scanner is open.'}</Text>{Platform.OS !== 'web' ? <Pressable onPress={() => void (permission?.canAskAgain ? requestPermission() : Linking.openSettings())} style={styles.permissionButton}><Text style={styles.permissionButtonText}>{permission?.canAskAgain ? 'Allow camera' : 'Open settings'}</Text></Pressable> : null}</View>}
        {locked && !academyName ? <View style={styles.loading}><ActivityIndicator color="#F6C85F" /><Text style={styles.loadingText}>Verifying Academy…</Text></View> : null}
      </View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => { setError(''); setLocked(false); }}><RefreshCw color="#FF8989" size={17} /></Pressable></View> : null}
      <View style={styles.manual}><Text style={styles.manualLabel}>QR TOKEN · TESTING FALLBACK</Text><View style={styles.manualRow}><TextInput value={manualToken} onChangeText={setManualToken} autoCapitalize="none" autoCorrect={false} placeholder="PFQR.…" placeholderTextColor="#656A73" style={styles.input} /><Pressable disabled={!manualToken.trim() || locked} onPress={() => void processToken(manualToken)} style={[styles.continue, (!manualToken.trim() || locked) && styles.disabled]}><Text style={styles.continueText}>Verify</Text></Pressable></View></View>
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#08090C' }, safe: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: spacing.xl },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#F6C85F', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.5 }, title: { color: '#fff', fontFamily: font.extraBold, fontSize: 20 }, copy: { marginTop: 24 }, copyTitle: { color: '#fff', fontFamily: font.extraBold, fontSize: 30, lineHeight: 36 }, copyText: { marginTop: 9, color: '#B9BBC2', fontFamily: font.regular, fontSize: 13, lineHeight: 20 },
  scannerShell: { flex: 1, minHeight: 300, maxHeight: 460, marginTop: 28, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(246,200,95,.35)', backgroundColor: '#101116' }, scanFrame: { position: 'absolute', top: '18%', left: '12%', right: '12%', bottom: '18%', borderWidth: 2, borderColor: '#F6C85F', borderRadius: 24 }, scanLine: { position: 'absolute', top: '50%', left: 14, right: 14, height: 2, backgroundColor: '#F6C85F', shadowColor: '#F6C85F', shadowOpacity: .8, shadowRadius: 8 }, loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(6,7,10,.72)', alignItems: 'center', justifyContent: 'center', gap: 10 }, loadingText: { color: '#fff', fontFamily: font.bold, fontSize: 12 }, permission: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' }, permissionTitle: { marginTop: 16, color: '#fff', fontFamily: font.extraBold, fontSize: 19 }, permissionText: { marginTop: 7, color: '#9EA2AC', fontFamily: font.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' }, permissionButton: { marginTop: 20, minHeight: 45, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#F6C85F', alignItems: 'center', justifyContent: 'center' }, permissionButtonText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 12 }, success: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' }, successTitle: { marginTop: 16, color: '#fff', fontFamily: font.extraBold, fontSize: 24, textAlign: 'center' }, successText: { marginTop: 8, color: '#AEB1BA', fontFamily: font.regular, fontSize: 12, textAlign: 'center' },
  error: { marginTop: 12, minHeight: 45, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,137,137,.35)', backgroundColor: 'rgba(255,90,90,.08)', flexDirection: 'row', alignItems: 'center', gap: 10 }, errorText: { flex: 1, color: '#FF9A9A', fontFamily: font.semibold, fontSize: 10, lineHeight: 15 }, manual: { marginTop: 18, marginBottom: spacing.xl }, manualLabel: { color: '#747984', fontFamily: font.bold, fontSize: 7, letterSpacing: 1.1 }, manualRow: { marginTop: 7, flexDirection: 'row', gap: 8 }, input: { flex: 1, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', backgroundColor: '#0D0E12', color: '#fff', fontFamily: font.regular, fontSize: 12 }, continue: { minWidth: 84, borderRadius: 14, backgroundColor: '#F6C85F', alignItems: 'center', justifyContent: 'center' }, continueText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 11 }, disabled: { opacity: .4 },
});
