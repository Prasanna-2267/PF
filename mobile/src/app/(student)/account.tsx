import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  LogOut,
  Mail,
  Moon,
  Phone,
  ShieldAlert,
  Sun,
  UserRound,
  X,
} from "lucide-react-native";
import { font, spacing } from "@/constants/theme";
import {
  clearLocalSession,
  getAuthErrorMessage,
  logoutSession,
} from "@/lib/auth-session";
import { useAuthStore } from "@/lib/auth-store";
import { learnerProfileFromPreference } from "@/lib/learner-preferences";
import { useLearnerProfileStore } from "@/lib/learner-profile-store";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-api";
import {
  confirmEmailChange,
  confirmMobileChange,
  getStudentAccount,
  requestAccountDeletion,
  requestEmailChange,
  requestMobileChange,
  resendEmailChange,
  updateAccountAppearance,
  updateAccountExam,
  updateAccountName,
  updateStudyTarget,
  verifyAccountDeletion,
  verifyCurrentEmailChange,
  type AccountChallenge,
  type StudentAccount,
} from "@/lib/student-account-api";
import { useAppTheme } from "@/providers/app-providers";
import { useResendCountdown } from "@/lib/use-resend-countdown";
import { PoweredByNeuralWebLabs } from "@/components/powered-by-neuralweb-labs";

const defaults: NotificationPreferences = {
  pushEnabled: true,
  broadcastEnabled: true,
  dailyPlanEnabled: true,
  streakRiskEnabled: true,
  securityEnabled: true,
  accountEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
type Editor = "name" | "email" | "mobile" | "exam" | "delete" | null;

export default function AccountScreen() {
  const router = useRouter();
  const { theme, preference, setPreference } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const profileStore = useLearnerProfileStore();
  const live = Boolean(token && !token.startsWith("ui-only-"));
  const [account, setAccount] = useState<StudentAccount | null>(null);
  const [notifications, setNotifications] = useState(defaults);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [customTargetHours, setCustomTargetHours] = useState("");
  const [customTargetMinutes, setCustomTargetMinutes] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

  const refresh = async () => {
    if (!live) return;
    setError("");
    try {
      const [next, prefs] = await Promise.all([
        getStudentAccount(),
        getNotificationPreferences(),
      ]);
      setAccount(next);
      setNotifications(prefs);
      setUser({
        ...user!,
        name: next.fullName,
        email: next.email,
        phone: next.phone,
        activeStageId: next.learnerPreference?.selectedCourseId ?? null,
      });
      if (next.learnerPreference)
        profileStore.updateProfile(
          learnerProfileFromPreference(
            next.learnerPreference,
            profileStore.profile,
          ),
        );
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  const display = account ?? {
    id: user?.id ?? "",
    email: user?.email ?? "",
    fullName: user?.name ?? "Student",
    phone: user?.phone ?? null,
    createdAt: "",
    activeAcademy: null,
    learnerPreference: null,
    learnerNotificationPreference: null,
  };
  const pref = display.learnerPreference;
  const exam = pref?.examDate ? new Date(pref.examDate) : null;
  const examLabel =
    exam && !Number.isNaN(exam.getTime())
      ? `${exam.getUTCDate()} ${months[exam.getUTCMonth()]} ${exam.getUTCFullYear()}`
      : "Not set";
  const targetLabel = pref
    ? `${Math.floor(pref.dailyTargetMinutes / 60) ? `${Math.floor(pref.dailyTargetMinutes / 60)}h ` : ""}${pref.dailyTargetMinutes % 60 ? `${pref.dailyTargetMinutes % 60}m` : ""}`.trim()
    : profileStore.profile.dailyTarget;

  const toggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = notifications;
    setNotifications({ ...previous, [key]: value });
    if (!live) return;
    try {
      setNotifications(await updateNotificationPreferences({ [key]: value }));
    } catch (e) {
      setNotifications(previous);
      Alert.alert("Could not save", getAuthErrorMessage(e));
    }
  };
  const chooseTheme = async (next: "light" | "dark") => {
    const previous = preference;
    setPreference(next);
    if (!live) return;
    try {
      const updated = await updateAccountAppearance(
        next.toUpperCase() as "LIGHT" | "DARK",
        pref?.version,
      );
      setAccount((current) =>
        current ? { ...current, learnerPreference: updated } : current,
      );
    } catch (e) {
      setPreference(previous);
      Alert.alert("Could not save appearance", getAuthErrorMessage(e));
    }
  };
  const saveStudyTarget = async (minutes: number) => {
    if (!live || savingTarget) return;
    setSavingTarget(true);
    try {
      const updated = await updateStudyTarget(minutes, pref?.version);
      setAccount((current) =>
        current ? { ...current, learnerPreference: updated } : current,
      );
      profileStore.updateProfile(
        learnerProfileFromPreference(updated, profileStore.profile),
      );
      setCustomTargetHours("");
      setCustomTargetMinutes("");
    } catch (e) {
      Alert.alert("Could not update target", getAuthErrorMessage(e));
    } finally {
      setSavingTarget(false);
    }
  };
  const applyCustomStudyTarget = () => {
    const hours = customTargetHours.trim() ? Number(customTargetHours) : 0;
    const minutes = customTargetMinutes.trim()
      ? Number(customTargetMinutes)
      : 0;
    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59
    ) {
      Alert.alert(
        "Invalid study time",
        "Enter whole hours and 0 to 59 minutes.",
      );
      return;
    }
    const total = hours * 60 + minutes;
    if (total < 15 || total > 720) {
      Alert.alert(
        "Invalid study time",
        "Choose a daily target between 15 minutes and 12 hours.",
      );
      return;
    }
    void saveStudyTarget(total);
  };
  const completeSignOut = () => {
    void logoutSession().finally(() => router.replace("/login"));
  };
  const signOut = () => {
    const message =
      "Protected local account data will be cleared from this device.";
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(`Sign out?\n\n${message}`)) completeSignOut();
      return;
    }
    Alert.alert("Sign out?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: completeSignOut },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.canvas }]}
      edges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.goldStrong }]}>
              YOUR ACCOUNT
            </Text>
            <Text style={[styles.title, { color: theme.fg }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Identity, learning plan and privacy in one place.
            </Text>
          </View>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.primaryStrong }]}>
              {display.fullName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.small, { color: theme.muted }]}>
              Loading secure account…
            </Text>
          </View>
        ) : null}
        {error ? (
          <Pressable
            onPress={() => void refresh()}
            style={[styles.error, { borderColor: theme.danger }]}
          >
            <Text style={[styles.small, { color: theme.danger }]}>
              {error} · Tap to retry
            </Text>
          </Pressable>
        ) : null}

        <Section
          title="Personal information"
          icon={<UserRound size={17} color={theme.primary} />}
        >
          <SettingRow
            icon={<UserRound size={18} color={theme.primary} />}
            label="Name"
            value={display.fullName}
            action="Edit"
            onPress={() => setEditor("name")}
          />
          <SettingRow
            icon={<Phone size={18} color={theme.primary} />}
            label="Mobile number"
            value={display.phone ?? "Not added"}
            action="Edit"
            onPress={() => setEditor("mobile")}
          />
          <SettingRow
            icon={<Mail size={18} color={theme.primary} />}
            label="Email"
            value={display.email}
            action="Verify & edit"
            onPress={() => setEditor("email")}
            last
          />
        </Section>

        <Section
          title="Academic information"
          icon={<GraduationCap size={18} color={theme.goldStrong} />}
        >
          <SettingRow
            icon={<GraduationCap size={18} color={theme.goldStrong} />}
            label="Academy"
            value={display.activeAcademy?.name ?? "Independent learner"}
            badge={display.activeAcademy ? "Verified" : undefined}
          />
          <SettingRow
            icon={<BookOpen size={18} color={theme.goldStrong} />}
            label="Course"
            value={pref?.selectedCourse?.name ?? profileStore.profile.examName}
            badge="View only"
          />
          <SettingRow
            icon={<CalendarDays size={18} color={theme.goldStrong} />}
            label="Exam date"
            value={examLabel}
            action="Edit"
            onPress={() => setEditor("exam")}
            last
          />
        </Section>

        <Section
          title="Study & progress"
          icon={<Clock3 size={17} color={theme.success} />}
        >
          <View style={styles.targetRow}>
            <View
              style={[styles.rowIcon, { backgroundColor: theme.successSoft }]}
            >
              <Clock3 size={18} color={theme.success} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                Daily study target
              </Text>
              <Text style={[styles.targetValue, { color: theme.fg }]}>
                {targetLabel}
              </Text>
              <Text style={[styles.rowHint, { color: theme.faint }]}>
                A streak day completes only after this target is reached.
              </Text>
            </View>
          </View>
          <View style={styles.targetChoices}>
            {[60, 90, 120, 180].map((minutes) => (
              <Pressable
                key={minutes}
                disabled={!live || savingTarget}
                onPress={() => void saveStudyTarget(minutes)}
                style={[
                  styles.choice,
                  {
                    borderColor:
                      pref?.dailyTargetMinutes === minutes
                        ? theme.goldStrong
                        : theme.line,
                    backgroundColor:
                      pref?.dailyTargetMinutes === minutes
                        ? theme.goldSoft
                        : theme.sunken,
                  },
                  (!live || savingTarget) && styles.disabled,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    {
                      color:
                        pref?.dailyTargetMinutes === minutes
                          ? theme.goldStrong
                          : theme.muted,
                    },
                  ]}
                >
                  {minutes < 60
                    ? `${minutes}m`
                    : minutes % 60
                      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
                      : `${minutes / 60}h`}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.customTargetBlock}>
            <Text style={[styles.customTargetLabel, { color: theme.faint }]}>
              CUSTOM STUDY TIME
            </Text>
            <View style={styles.customTargetRow}>
              <TextInput
                accessibilityLabel="Custom daily study hours"
                editable={live && !savingTarget}
                keyboardType="number-pad"
                value={customTargetHours}
                onChangeText={setCustomTargetHours}
                onSubmitEditing={applyCustomStudyTarget}
                placeholder="Hours"
                placeholderTextColor={theme.faint}
                style={[
                  styles.customTargetInput,
                  {
                    color: theme.fg,
                    borderColor: theme.line,
                    backgroundColor: theme.sunken,
                  },
                ]}
              />
              <TextInput
                accessibilityLabel="Custom daily study minutes"
                editable={live && !savingTarget}
                keyboardType="number-pad"
                value={customTargetMinutes}
                onChangeText={setCustomTargetMinutes}
                onSubmitEditing={applyCustomStudyTarget}
                placeholder="Minutes"
                placeholderTextColor={theme.faint}
                style={[
                  styles.customTargetInput,
                  {
                    color: theme.fg,
                    borderColor: theme.line,
                    backgroundColor: theme.sunken,
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!live || savingTarget}
                onPress={applyCustomStudyTarget}
                style={[
                  styles.customTargetButton,
                  { backgroundColor: theme.goldSoft },
                  (!live || savingTarget) && styles.disabled,
                ]}
              >
                {savingTarget ? (
                  <ActivityIndicator size="small" color={theme.goldStrong} />
                ) : (
                  <Text
                    style={[
                      styles.customTargetButtonText,
                      { color: theme.goldStrong },
                    ]}
                  >
                    Set
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Section>

        <Section
          title="Notifications"
          icon={<Bell size={17} color={theme.primary} />}
        >
          {(
            [
              [
                "pushEnabled",
                "Push notifications",
                "Master control for this device",
              ],
              [
                "broadcastEnabled",
                "Announcements",
                "Updates from Parallax Flow",
              ],
              [
                "dailyPlanEnabled",
                "Daily study plan",
                "Your planned work at reminder time",
              ],
              [
                "streakRiskEnabled",
                "Streak at risk",
                "A final nudge before the day closes",
              ],
              [
                "quietHoursEnabled",
                "Quiet hours",
                `${notifications.quietHoursStart}–${notifications.quietHoursEnd}`,
              ],
            ] as const
          ).map(([key, label, hint], index, all) => (
            <ToggleRow
              key={key}
              label={label}
              hint={hint}
              value={notifications[key]}
              onChange={(value) => void toggle(key, value)}
              last={index === all.length - 1}
            />
          ))}
        </Section>

        <Section
          title="Appearance"
          icon={
            preference === "light" ? (
              <Sun size={17} color={theme.goldStrong} />
            ) : (
              <Moon size={17} color={theme.primary} />
            )
          }
        >
          <View style={styles.themeRow}>
            {(["light", "dark"] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => void chooseTheme(mode)}
                style={[
                  styles.themeChoice,
                  {
                    borderColor:
                      preference === mode ? theme.primary : theme.line,
                    backgroundColor:
                      preference === mode ? theme.primarySoft : theme.sunken,
                  },
                ]}
              >
                {mode === "light" ? (
                  <Sun
                    size={18}
                    color={preference === mode ? theme.primary : theme.muted}
                  />
                ) : (
                  <Moon
                    size={18}
                    color={preference === mode ? theme.primary : theme.muted}
                  />
                )}
                <Text
                  style={[
                    styles.themeText,
                    {
                      color:
                        preference === mode ? theme.primaryStrong : theme.muted,
                    },
                  ]}
                >
                  {mode === "light" ? "Light" : "Dark"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section
          title="Session"
          icon={<LogOut size={17} color={theme.muted} />}
        >
          <SettingRow
            icon={<LogOut size={18} color={theme.muted} />}
            label="Sign out"
            value="Clear protected data from this device"
            action="Sign out"
            onPress={signOut}
            last
          />
        </Section>
        <View
          style={[
            styles.danger,
            { backgroundColor: theme.surface, borderColor: theme.danger },
          ]}
        >
          <View style={styles.sectionHead}>
            <ShieldAlert size={18} color={theme.danger} />
            <Text style={[styles.sectionTitle, { color: theme.danger }]}>
              Danger zone
            </Text>
          </View>
          <Text style={[styles.dangerCopy, { color: theme.muted }]}>
            Deleting your account disables sign-in and revokes every active
            session. Verification is required.
          </Text>
          <Pressable
            onPress={() => setEditor("delete")}
            style={[styles.deleteButton, { borderColor: theme.danger }]}
          >
            <Text style={[styles.deleteText, { color: theme.danger }]}>
              Delete account
            </Text>
          </Pressable>
        </View>
        <PoweredByNeuralWebLabs />
      </ScrollView>
      <AccountEditor
        key={editor ?? "closed"}
        editor={editor}
        account={display}
        onClose={() => setEditor(null)}
        onRefresh={refresh}
        onSignedOut={async () => {
          await clearLocalSession();
          router.replace("/login");
        }}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <View style={styles.sectionHead}>
        {icon}
        <Text style={[styles.sectionTitle, { color: theme.fg }]}>{title}</Text>
      </View>
      <View style={[styles.sectionBody, { borderTopColor: theme.line }]}>
        {children}
      </View>
    </View>
  );
}
function SettingRow({
  icon,
  label,
  value,
  action,
  badge,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: string;
  badge?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.settingRow,
        !last && {
          borderBottomColor: theme.line,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.sunken }]}>
        {icon}
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, { color: theme.muted }]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.rowValue, { color: theme.fg }]}>
          {value}
        </Text>
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.sunken }]}>
          <Text style={[styles.badgeText, { color: theme.faint }]}>
            {badge}
          </Text>
        </View>
      ) : action ? (
        <View style={styles.rowAction}>
          <Text style={[styles.actionText, { color: theme.primary }]}>
            {action}
          </Text>
          <ChevronRight size={15} color={theme.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}
function ToggleRow({
  label,
  hint,
  value,
  onChange,
  last,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.toggleRow,
        !last && {
          borderBottomColor: theme.line,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.rowCopy}>
        <Text style={[styles.toggleLabel, { color: theme.fg }]}>{label}</Text>
        <Text style={[styles.rowHint, { color: theme.muted }]}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.lineStrong, true: theme.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function AccountEditor({
  editor,
  account,
  onClose,
  onRefresh,
  onSignedOut,
}: {
  editor: Editor;
  account: StudentAccount;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSignedOut: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [value, setValue] = useState(
    editor === "name"
      ? account.fullName
      : editor === "email"
        ? account.email
        : editor === "mobile"
          ? (account.phone ?? "")
          : "",
  );
  const [challenge, setChallenge] = useState<AccountChallenge | null>(null);
  const resendCountdown = useResendCountdown(challenge?.resendAfter);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const otpInput = useRef<TextInput>(null);
  const date = account.learnerPreference?.examDate
    ? new Date(account.learnerPreference.examDate)
    : new Date();
  const [month, setMonth] = useState(date.getUTCMonth() + 1);
  const [year, setYear] = useState(
    Math.max(new Date().getUTCFullYear(), date.getUTCFullYear()),
  );
  const [day, setDay] = useState(
    account.learnerPreference?.examDatePrecision === "DAY"
      ? String(date.getUTCDate())
      : "",
  );
  const title =
    editor === "name"
      ? "Edit your name"
      : editor === "email"
        ? "Change email"
        : editor === "mobile"
          ? "Change mobile number"
          : editor === "exam"
            ? "Update exam date"
            : "Delete account";
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (editor === "name") {
        await updateAccountName(value);
        await onRefresh();
        onClose();
      } else if (editor === "exam") {
        await updateAccountExam({
          examMonth: month,
          examYear: year,
          ...(day.trim() ? { examDay: Number(day) } : {}),
          expectedVersion: account.learnerPreference?.version,
        });
        await onRefresh();
        onClose();
      } else if (!challenge) {
        setChallenge(
          editor === "email"
            ? await requestEmailChange(value)
            : editor === "mobile"
              ? await requestMobileChange(value)
              : await requestAccountDeletion(),
        );
      } else {
        if (editor === "email" && challenge.stage === "CURRENT_EMAIL") {
          setChallenge(await verifyCurrentEmailChange(challenge.challengeId, code));
          setCode("");
          otpInput.current?.focus();
        } else if (editor === "email") {
          await confirmEmailChange(challenge.challengeId, code);
          await onSignedOut();
        } else if (editor === "mobile") {
          await confirmMobileChange(challenge.challengeId, code);
          await onRefresh();
          onClose();
        } else {
          await verifyAccountDeletion(challenge.challengeId, code);
          await onSignedOut();
        }
      }
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (!resendCountdown.canResend || busy) return;
    setBusy(true);
    setError("");
    setCode("");
    try {
      setChallenge(
        editor === "email" && challenge
          ? await resendEmailChange(challenge.challengeId)
          : editor === "email"
            ? await requestEmailChange(value)
          : editor === "mobile"
            ? await requestMobileChange(value)
            : await requestAccountDeletion(),
      );
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const otp = challenge !== null;
  return (
    <Modal
      visible={editor !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalRoot}
      >
        <Pressable style={styles.scrim} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: editor === "delete" ? theme.danger : theme.line,
            },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.lineStrong }]}
          />
          <View style={styles.sheetHead}>
            <View>
              <Text
                style={[
                  styles.sheetEyebrow,
                  {
                    color:
                      editor === "delete" ? theme.danger : theme.goldStrong,
                  },
                ]}
              >
                {otp
                  ? "SECURE VERIFICATION"
                  : editor === "delete"
                    ? "DESTRUCTIVE ACTION"
                    : "ACCOUNT SETTING"}
              </Text>
              <Text style={[styles.sheetTitle, { color: theme.fg }]}>
                {otp ? "Enter verification code" : title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.close, { backgroundColor: theme.sunken }]}
            >
              <X size={18} color={theme.muted} />
            </Pressable>
          </View>
          {otp ? (
            <>
              <Text style={[styles.sheetCopy, { color: theme.muted }]}>
                {editor === "email" && challenge.stage === "CURRENT_EMAIL"
                  ? `First verify your existing email. We sent a 4-digit code to ${challenge.maskedTarget}.`
                  : editor === "email" && challenge.stage === "NEW_EMAIL"
                    ? `Your existing email is verified. Now enter the code sent to your new email, ${challenge.maskedTarget}.`
                    : `We sent a 4-digit code to ${challenge.maskedTarget}. The current value stays unchanged until verification succeeds.`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enter verification code"
                onPress={() => otpInput.current?.focus()}
                style={styles.otpRow}
              >
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpCell,
                      {
                        borderColor: code[index]
                          ? theme.goldStrong
                          : theme.line,
                        backgroundColor: theme.sunken,
                      },
                    ]}
                  >
                    <Text style={[styles.otpDigit, { color: theme.fg }]}>
                      {code[index] ?? "•"}
                    </Text>
                  </View>
                ))}
              </Pressable>
              <TextInput
                ref={otpInput}
                autoFocus
                value={code}
                onChangeText={(text) =>
                  setCode(text.replace(/\D/g, "").slice(0, 4))
                }
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={4}
                style={styles.hiddenOtp}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy || !resendCountdown.canResend }}
                disabled={busy || !resendCountdown.canResend}
                onPress={() => void resend()}
              >
                <Text style={[styles.resendText, { color: resendCountdown.canResend ? theme.primary : theme.faint }]}>
                  {resendCountdown.label}
                </Text>
              </Pressable>
              {challenge.developmentCode ? (
                <Text style={[styles.devCode, { color: theme.goldStrong }]}>
                  Development code: {challenge.developmentCode}
                </Text>
              ) : null}
            </>
          ) : editor === "exam" ? (
            <>
              <Text style={[styles.sheetCopy, { color: theme.muted }]}>
                Choose the month and year. Leave the exact day blank to use the
                first day of the month.
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRail}
              >
                {months.map((label, index) => (
                  <Pressable
                    key={label}
                    onPress={() => setMonth(index + 1)}
                    style={[
                      styles.pill,
                      {
                        borderColor:
                          month === index + 1 ? theme.goldStrong : theme.line,
                        backgroundColor:
                          month === index + 1 ? theme.goldSoft : theme.sunken,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color:
                            month === index + 1
                              ? theme.goldStrong
                              : theme.muted,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRail}
              >
                {Array.from(
                  { length: 8 },
                  (_, i) => new Date().getUTCFullYear() + i,
                ).map((entry) => (
                  <Pressable
                    key={entry}
                    onPress={() => setYear(entry)}
                    style={[
                      styles.pill,
                      {
                        borderColor:
                          year === entry ? theme.goldStrong : theme.line,
                        backgroundColor:
                          year === entry ? theme.goldSoft : theme.sunken,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color:
                            year === entry ? theme.goldStrong : theme.muted,
                        },
                      ]}
                    >
                      {entry}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                value={day}
                onChangeText={(text) =>
                  setDay(text.replace(/\D/g, "").slice(0, 2))
                }
                placeholder="Exact day · optional"
                placeholderTextColor={theme.faint}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  {
                    color: theme.fg,
                    borderColor: theme.line,
                    backgroundColor: theme.sunken,
                  },
                ]}
              />
            </>
          ) : (
            <>
              <Text style={[styles.sheetCopy, { color: theme.muted }]}>
                {editor === "delete"
                  ? `A code will be sent to ${account.email}. This disables the account and revokes every session.`
                  : editor === "email"
                    ? "Your existing email and new email must both be verified before your sign-in identity changes. You will then sign in again."
                    : editor === "mobile"
                      ? `Enter the new number. A verification code will be sent to your registered email, ${account.email}.`
                      : "Use the name you want shown throughout Parallax Flow."}
              </Text>
              {editor !== "delete" ? (
                <TextInput
                  autoFocus
                  value={value}
                  onChangeText={setValue}
                  autoCapitalize={
                    editor === "email"
                      ? "none"
                      : editor === "name"
                        ? "words"
                        : "none"
                  }
                  keyboardType={
                    editor === "email"
                      ? "email-address"
                      : editor === "mobile"
                        ? "phone-pad"
                        : "default"
                  }
                  style={[
                    styles.input,
                    {
                      color: theme.fg,
                      borderColor: theme.line,
                      backgroundColor: theme.sunken,
                    },
                  ]}
                />
              ) : null}
            </>
          )}
          {error ? (
            <Text style={[styles.sheetError, { color: theme.danger }]}>
              {error}
            </Text>
          ) : null}
          <Pressable
            disabled={busy || (otp && code.length !== 4)}
            onPress={() => void submit()}
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  editor === "delete" ? theme.danger : theme.primary,
              },
              (busy || (otp && code.length !== 4)) && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {otp && editor === "email" && challenge.stage === "CURRENT_EMAIL"
                  ? "Verify current email"
                  : otp && editor === "email"
                    ? "Verify new email"
                    : otp
                      ? "Verify code"
                  : editor === "delete"
                    ? "Send deletion code"
                    : "Save securely"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: 110,
    gap: 14,
  },
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.5 },
  title: {
    marginTop: 3,
    fontFamily: font.extraBold,
    fontSize: 29,
    letterSpacing: -0.8,
  },
  subtitle: { marginTop: 4, fontFamily: font.regular, fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: font.extraBold, fontSize: 14 },
  loading: {
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  small: { fontFamily: font.medium, fontSize: 11 },
  error: { padding: 12, borderRadius: 12, borderWidth: 1 },
  section: { borderWidth: 1, borderRadius: 20, overflow: "hidden" },
  sectionHead: {
    minHeight: 46,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: { fontFamily: font.extraBold, fontSize: 13 },
  sectionBody: { borderTopWidth: StyleSheet.hairlineWidth },
  settingRow: {
    minHeight: 68,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: font.medium, fontSize: 9 },
  rowValue: { marginTop: 3, fontFamily: font.bold, fontSize: 12 },
  rowHint: {
    marginTop: 3,
    fontFamily: font.regular,
    fontSize: 8.5,
    lineHeight: 13,
  },
  rowAction: { flexDirection: "row", alignItems: "center", gap: 2 },
  actionText: { fontFamily: font.bold, fontSize: 9 },
  badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontFamily: font.bold, fontSize: 7.5 },
  targetRow: { padding: 13, flexDirection: "row", gap: 10 },
  targetValue: { marginTop: 2, fontFamily: font.extraBold, fontSize: 20 },
  targetChoices: { flexDirection: "row", gap: 7, padding: 13, paddingTop: 0 },
  choice: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: { fontFamily: font.bold, fontSize: 9 },
  customTargetBlock: { paddingHorizontal: 13, paddingBottom: 13, gap: 6 },
  customTargetLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 },
  customTargetRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  customTargetInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 10,
    fontFamily: font.medium,
    fontSize: 10,
  },
  customTargetButton: {
    height: 40,
    minWidth: 55,
    borderRadius: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  customTargetButtonText: { fontFamily: font.bold, fontSize: 10 },
  toggleRow: {
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleLabel: { fontFamily: font.bold, fontSize: 11 },
  themeRow: { flexDirection: "row", gap: 9, padding: 13 },
  themeChoice: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  themeText: { fontFamily: font.bold, fontSize: 11 },
  danger: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    paddingBottom: 14,
  },
  dangerCopy: {
    paddingHorizontal: 15,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  deleteButton: {
    marginHorizontal: 15,
    marginTop: 12,
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { fontFamily: font.bold, fontSize: 11 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,.72)" },
  sheet: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "88%",
    alignSelf: "center",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 32 : 22,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sheetEyebrow: { fontFamily: font.bold, fontSize: 7.5, letterSpacing: 1.2 },
  sheetTitle: { marginTop: 4, fontFamily: font.extraBold, fontSize: 20 },
  close: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCopy: {
    marginTop: 13,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  input: {
    minHeight: 51,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 14,
    fontFamily: font.semibold,
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 50,
    marginTop: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontFamily: font.extraBold, fontSize: 12 },
  disabled: { opacity: 0.5 },
  sheetError: { marginTop: 10, fontFamily: font.medium, fontSize: 10 },
  otpRow: { flexDirection: "row", gap: 9, marginTop: 18 },
  otpCell: {
    flex: 1,
    height: 58,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: { fontFamily: font.extraBold, fontSize: 22 },
  hiddenOtp: { position: "absolute", width: 1, height: 1, opacity: 0 },
  resendText: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: font.bold,
    fontSize: 10,
  },
  devCode: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: font.bold,
    fontSize: 10,
  },
  pillRail: { gap: 7, paddingTop: 13, paddingRight: 10 },
  pill: {
    minWidth: 57,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontFamily: font.bold, fontSize: 10 },
});
