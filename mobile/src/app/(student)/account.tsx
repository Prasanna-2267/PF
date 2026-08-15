import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { font, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { type LearnerProfile, useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useAppTheme } from '@/providers/app-providers';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const setUser = useAuthStore((state) => state.setUser);
  const { theme, preference, setPreference } = useAppTheme();
  const savedProfile = useLearnerProfileStore((state) => state.profile);
  const updateProfile = useLearnerProfileStore((state) => state.updateProfile);
  const [profile, setProfile] = useState<LearnerProfile>(savedProfile);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);

  const setField = (field: keyof LearnerProfile, value: string) => { setProfile((current) => ({ ...current, [field]: value })); setSaved(false); };
  const saveProfile = () => {
    updateProfile(profile);
    if (user) setUser({ ...user, phone: phone.trim() || null });
    setSaved(true);
  };
  const logout = () => { clear(); router.replace('/login'); };

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['left', 'right']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={[styles.eyebrow, { color: theme.goldStrong }]}>YOUR PROFILE</Text>
    <Text style={[styles.title, { color: theme.fg }]}>Account</Text>
    <Text style={[styles.description, { color: theme.muted }]}>Your exam profile keeps Notes, your plan, and reminders focused on the right goal.</Text>

    <Card><View style={styles.profile}><View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={styles.avatarText}>{user?.name.charAt(0) ?? 'A'}</Text></View><View style={styles.profileCopy}><Text style={[styles.name, { color: theme.fg }]}>{user?.name ?? 'Student'}</Text><Text style={[styles.email, { color: theme.muted }]}>{user?.email ?? 'Add your email'}</Text><Text style={[styles.verified, { color: theme.success }]}>Email verified</Text></View></View><View style={[styles.rule, { backgroundColor: theme.line }]} /><AppTextField label="Mobile number (for study reminders)" value={phone} onChangeText={(value) => { setPhone(value); setSaved(false); }} placeholder="+91 98765 43210" keyboardType="phone-pad" /></Card>

    <Card><Text style={[styles.cardTitle, { color: theme.fg }]}>Exam profile</Text><Text style={[styles.copy, { color: theme.muted }]}>Required to show the correct course, category, exam countdown, and study material.</Text><View style={styles.fieldRow}><View style={styles.fieldHalf}><AppTextField label="Exam name" value={profile.examName} onChangeText={(value) => setField('examName', value)} placeholder="JEE" /></View><View style={styles.fieldHalf}><AppTextField label="Category / stage" value={profile.category} onChangeText={(value) => setField('category', value)} placeholder="Mains" /></View></View><AppTextField label="Exam date" value={profile.examDate} onChangeText={(value) => setField('examDate', value)} placeholder="Sep 2026" /><Text style={[styles.fieldHint, { color: theme.faint }]}>Month and year are required. If the day is omitted, it is saved as the 1st.</Text><AppTextField label="Academy ID (optional)" value={profile.academyId} onChangeText={(value) => setField('academyId', value)} placeholder="Academy or institute code" autoCapitalize="characters" /></Card>

    <Card><Text style={[styles.cardTitle, { color: theme.fg }]}>Study setup</Text><Text style={[styles.copy, { color: theme.muted }]}>These settings personalise your daily target and reminder schedule.</Text><View style={styles.fieldRow}><View style={styles.fieldHalf}><AppTextField label="Daily focus target" value={profile.dailyTarget} onChangeText={(value) => setField('dailyTarget', value)} placeholder="2 hours" /></View><View style={styles.fieldHalf}><AppTextField label="Reminder time" value={profile.reminderTime} onChangeText={(value) => setField('reminderTime', value)} placeholder="7:00 PM" /></View></View><View style={styles.fieldRow}><View style={styles.fieldHalf}><AppTextField label="Study language" value={profile.language} onChangeText={(value) => setField('language', value)} placeholder="English" /></View><View style={styles.fieldHalf}><AppTextField label="Time zone" value={profile.timezone} onChangeText={(value) => setField('timezone', value)} placeholder="Asia/Kolkata" autoCapitalize="none" /></View></View></Card>

    <AppButton label={saved ? 'Profile saved' : 'Save study profile'} onPress={saveProfile} />
    {saved ? <Text style={[styles.saved, { color: theme.success }]}>Saved locally for this UI demo.</Text> : null}

    <Card><Text style={[styles.cardTitle, { color: theme.fg }]}>Appearance</Text><Text style={[styles.copy, { color: theme.muted }]}>Choose how Parallax Flow looks on this device.</Text><View style={styles.row}><AppButton label="Light" variant={preference === 'light' ? 'primary' : 'secondary'} onPress={() => setPreference('light')} /><AppButton label="Dark" variant={preference === 'dark' ? 'primary' : 'secondary'} onPress={() => setPreference('dark')} /></View></Card>
    <Card><Text style={[styles.cardTitle, { color: theme.fg }]}>Session</Text><Text style={[styles.copy, { color: theme.muted }]}>This demo only changes local UI state.</Text><AppButton label="Sign out" variant="secondary" onPress={logout} /></Card>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 88, maxWidth: 680, width: '100%', alignSelf: 'center' }, eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.4 }, title: { fontFamily: font.extraBold, fontSize: 30, letterSpacing: -0.8 }, description: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, marginTop: -7 }, profile: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, profileCopy: { flex: 1, minWidth: 0 }, avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 20 }, name: { fontFamily: font.bold, fontSize: 16 }, email: { fontFamily: font.regular, fontSize: 13, marginTop: 2 }, verified: { fontFamily: font.semibold, fontSize: 10, marginTop: 4 }, rule: { height: 1, marginVertical: spacing.md }, cardTitle: { fontFamily: font.bold, fontSize: 16 }, copy: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 3 }, fieldRow: { flexDirection: 'row', gap: spacing.sm }, fieldHalf: { flex: 1, minWidth: 0 }, fieldHint: { fontFamily: font.regular, fontSize: 10, marginTop: -5 }, row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, saved: { fontFamily: font.semibold, fontSize: 12, textAlign: 'center', marginTop: -7 },
});
