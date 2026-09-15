import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  FileChartColumnIncreasing,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { font, spacing } from "@/constants/theme";
import { getAuthErrorMessage } from "@/lib/auth-session";
import {
  listMonthlyReports,
  type MonthlyReportItem,
} from "@/lib/monthly-report-api";
import { STORE_BASE_URL } from "@/lib/env";
import { useAppTheme } from "@/providers/app-providers";

const nativeDriver = Platform.OS !== "web";

export default function MonthlyReportsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const entrance = useMemo(() => new Animated.Value(0), []);
  const archive = useQuery({
    queryKey: ["student", "monthly-reports"],
    queryFn: listMonthlyReports,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      const reports = query.state.data?.items ?? [];
      if (reports.some((item) => item.status === "GENERATING" || (item.status === "PENDING" && !item.isScheduled))) return 4_000;
      if (reports.some((item) => item.status === "PENDING" && item.isScheduled)) return 60_000;
      return false;
    },
  });

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    }).start();
  }, [entrance]);
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/tracker");
  const data = archive.data;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.canvas }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            style={[
              styles.back,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <ArrowLeft color={theme.fg} size={20} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.goldStrong }]}>
              MONTHLY INTELLIGENCE
            </Text>
            <Text style={[styles.title, { color: theme.fg }]}>
              Monthly reports
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Your real progress, preserved as a secure report.
            </Text>
          </View>
          <View
            style={[styles.headerIcon, { backgroundColor: theme.goldSoft }]}
          >
            <FileChartColumnIncreasing color={theme.goldStrong} size={22} />
          </View>
        </View>

        {archive.isLoading ? (
          <State
            icon={<ActivityIndicator color={theme.goldStrong} />}
            title="Opening your archive"
            copy="Checking your report entitlement and completed months."
          />
        ) : archive.isError ? (
          <Pressable onPress={() => archive.refetch()}>
            <State
              icon={<RefreshCw color={theme.goldStrong} size={22} />}
              title="Archive unavailable"
              copy={getAuthErrorMessage(archive.error)}
            />
          </Pressable>
        ) : !data?.access.owned ? (
          <Locked product={data?.access.product} />
        ) : (
          <Animated.View
            style={{
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={[
                styles.ownedHero,
                { backgroundColor: theme.surface, borderColor: theme.gold },
              ]}
            >
              <View style={[styles.crown, { backgroundColor: theme.goldSoft }]}>
                <Crown color={theme.goldStrong} size={23} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.ownedLabel, { color: theme.goldStrong }]}>
                  REPORT ACCESS ACTIVE
                </Text>
                <Text style={[styles.ownedTitle, { color: theme.fg }]}>
                  Your month-by-month learning record
                </Text>
                <Text style={[styles.ownedCopy, { color: theme.muted }]}>
                  Reports use recorded practice, study activity, progress and
                  test data. They never invent missing metrics.
                </Text>
              </View>
              <ShieldCheck color={theme.success} size={20} />
            </View>
            <View style={styles.sectionHead}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.fg }]}>
                  Report archive
                </Text>
                <Text style={[styles.sectionCopy, { color: theme.muted }]}>
                  Automatically generated reports, preserved for viewing
                </Text>
              </View>
              <Text style={[styles.count, { color: theme.muted }]}>
                {data.items.length} reports
              </Text>
            </View>
            <View style={styles.list}>
              {data.items.length ? (
                data.items.map((report, index) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    index={index}
                    onView={() =>
                      router.push({
                        pathname: "/monthly-report/[id]",
                        params: { id: report.id, label: report.label },
                      })
                    }
                  />
                ))
              ) : (
                <State
                  icon={<CalendarDays color={theme.goldStrong} size={22} />}
                  title="No completed month yet"
                  copy="Your first report is generated automatically after the current calendar month closes."
                />
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Locked({
  product,
}: {
  product?: {
    name: string;
    description: string | null;
    price: number;
    currency: string;
    storePath: string;
  };
}) {
  const { theme } = useAppTheme();
  const openStore = () =>
    product && Linking.openURL(`${STORE_BASE_URL}${product.storePath}`);
  return (
    <View
      style={[
        styles.locked,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <View style={[styles.lockOrb, { backgroundColor: theme.goldSoft }]}>
        <LockKeyhole color={theme.goldStrong} size={28} />
      </View>
      <Text style={[styles.lockEyebrow, { color: theme.goldStrong }]}>
        PAID REPORT ARCHIVE
      </Text>
      <Text style={[styles.lockTitle, { color: theme.fg }]}>
        {product?.name ?? "Monthly Report"}
      </Text>
      <Text style={[styles.lockCopy, { color: theme.muted }]}>
        {product?.description ??
          "A professional monthly report generated from your actual learning activity."}
      </Text>
      <View style={styles.features}>
        {[
          "10-section professional PDF",
          "Real practice and study analytics",
          "Secure report archive",
        ].map((item) => (
          <View key={item} style={styles.feature}>
            <CheckCircle2 color={theme.success} size={16} />
            <Text style={[styles.featureText, { color: theme.fg }]}>
              {item}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={openStore}
        disabled={!product}
        style={[styles.primary, { backgroundColor: theme.gold }]}
      >
        <Text style={styles.primaryText}>Get the Monthly Report</Text>
        <ArrowUpRight color="#17130B" size={18} />
      </Pressable>
      <Text style={[styles.webOnly, { color: theme.muted }]}>
        Purchases are completed securely in the Parallax Flow web store.
      </Text>
    </View>
  );
}

function ReportCard({
  report,
  index,
  onView,
}: {
  report: MonthlyReportItem;
  index: number;
  onView: () => void;
}) {
  const { theme } = useAppTheme();
  const ready = report.status === "READY";
  const scheduled = report.status === "PENDING" && report.isScheduled;
  const working =
    report.status === "GENERATING" ||
    (report.status === "PENDING" && !scheduled);
  const date = report.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  return (
    <View
      style={[
        styles.report,
        {
          backgroundColor: theme.surface,
          borderColor: ready
            ? theme.primary
            : report.status === "FAILED"
              ? theme.danger
              : theme.line,
        },
      ]}
    >
      <View
        style={[
          styles.reportIcon,
          { backgroundColor: index % 2 ? theme.primarySoft : theme.goldSoft },
        ]}
      >
        <FileChartColumnIncreasing
          color={index % 2 ? theme.primaryStrong : theme.goldStrong}
          size={22}
        />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.reportMonth, { color: theme.fg }]}>
          {report.label}
        </Text>
        <View style={styles.meta}>
          {scheduled ? (
            <CalendarDays color={theme.goldStrong} size={13} />
          ) : working ? (
            <Clock3 color={theme.goldStrong} size={13} />
          ) : ready ? (
            <CheckCircle2 color={theme.success} size={13} />
          ) : (
            <RefreshCw color={theme.danger} size={13} />
          )}
          <Text style={[styles.metaText, { color: theme.muted }]}>
            {scheduled
              ? "Scheduled for the 1st"
              : working
                ? "Generating automatically"
                : ready
                  ? `Generated ${date}`
                  : "Automatic retry pending"}
          </Text>
        </View>
        <Text style={[styles.version, { color: theme.faint }]}>
          Version {report.version}
          {report.sizeBytes
            ? ` · ${(report.sizeBytes / 1024).toFixed(0)} KB`
            : ""}
        </Text>
      </View>
      {ready ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${report.label} report`}
          onPress={onView}
          style={[styles.action, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.actionText, { color: "#FFFFFF" }]}>View</Text>
        </Pressable>
      ) : working ? (
        <View style={[styles.action, { backgroundColor: theme.goldSoft }]}>
          <ActivityIndicator color={theme.goldStrong} size="small" />
        </View>
      ) : (
        <View style={[styles.action, { backgroundColor: theme.goldSoft }]}>
          <Text style={[styles.actionText, { color: theme.goldStrong }]}>
            {scheduled ? "Scheduled" : "Auto retry"}
          </Text>
        </View>
      )}
    </View>
  );
}

function State({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.state,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <View style={[styles.stateIcon, { backgroundColor: theme.goldSoft }]}>
        {icon}
      </View>
      <Text style={[styles.stateTitle, { color: theme.fg }]}>{title}</Text>
      <Text style={[styles.stateCopy, { color: theme.muted }]}>{copy}</Text>
    </View>
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
  },
  flex: { flex: 1, minWidth: 0 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
  },
  back: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 },
  title: {
    marginTop: 4,
    fontFamily: font.extraBold,
    fontSize: 27,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ownedHero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  crown: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  ownedLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 },
  ownedTitle: {
    marginTop: 4,
    fontFamily: font.extraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  ownedCopy: {
    marginTop: 5,
    fontFamily: font.regular,
    fontSize: 9,
    lineHeight: 14,
  },
  sectionHead: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: { fontFamily: font.extraBold, fontSize: 19 },
  sectionCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
  count: { fontFamily: font.medium, fontSize: 9 },
  list: { gap: 10 },
  report: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 19,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  reportMonth: { fontFamily: font.extraBold, fontSize: 15 },
  meta: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { flex: 1, fontFamily: font.medium, fontSize: 8 },
  version: { marginTop: 4, fontFamily: font.regular, fontSize: 7 },
  action: {
    minWidth: 58,
    height: 38,
    borderRadius: 13,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontFamily: font.bold, fontSize: 9 },
  locked: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
  },
  lockOrb: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  lockEyebrow: {
    marginTop: 17,
    fontFamily: font.bold,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  lockTitle: {
    marginTop: 7,
    fontFamily: font.extraBold,
    fontSize: 21,
    textAlign: "center",
  },
  lockCopy: {
    marginTop: 8,
    maxWidth: 420,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  features: { alignSelf: "stretch", marginTop: 20, gap: 10 },
  feature: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontFamily: font.semibold, fontSize: 10 },
  primary: {
    alignSelf: "stretch",
    minHeight: 52,
    marginTop: 22,
    borderRadius: 16,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryText: { color: "#17130B", fontFamily: font.extraBold, fontSize: 11 },
  webOnly: {
    marginTop: 9,
    fontFamily: font.regular,
    fontSize: 8,
    textAlign: "center",
  },
  state: {
    minHeight: 240,
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    marginTop: 14,
    fontFamily: font.extraBold,
    fontSize: 16,
    textAlign: "center",
  },
  stateCopy: {
    marginTop: 6,
    maxWidth: 360,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  error: {
    marginTop: 12,
    fontFamily: font.medium,
    fontSize: 10,
    textAlign: "center",
  },
});
