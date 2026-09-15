import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ChevronRight, CircleHelp, ExternalLink, FileImage, FileText, Folder, LockKeyhole, PackageCheck, Play, ShoppingBag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, spacing } from '@/constants/theme';
import { STORE_BASE_URL } from '@/lib/env';
import { getPackage, type PackageContentNode } from '@/lib/student-content-api';
import { useAppTheme } from '@/providers/app-providers';

const supportedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const packageId = Array.isArray(id) ? id[0] : id;
  const query = useQuery({ queryKey: ['student', 'packages', packageId], queryFn: () => getPackage(packageId!), enabled: Boolean(packageId) });
  const item = query.data;
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/notes');
  const browseStore = async () => {
    if (!item) return;
    await WebBrowser.openBrowserAsync(`${STORE_BASE_URL}/store/product/${encodeURIComponent(item.id)}?type=package`);
  };
  const openFile = (node: PackageContentNode) => {
    if (!item?.access.owned || node.kind !== 'FILE' || !node.mimeType || !supportedMimeTypes.has(node.mimeType)) return;
    router.push({ pathname: '/lesson/[id]', params: { id: node.id, returnTo: `/package/${item.id}` } });
  };
  const openQuestionBank = (questionBankId: string) => {
    if (!item?.access.owned) return;
    router.push({ pathname: '/practice', params: { mode: 'QUESTION_BANK', questionBankId } });
  };

  if (query.isLoading) return <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: theme.canvas }]}><ActivityIndicator color={theme.goldStrong} /><Text style={[styles.status, { color: theme.muted }]}>Opening package details…</Text></SafeAreaView>;
  if (!item) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><Header title="Package" onBack={goBack} /><View style={styles.center}><Text style={[styles.errorTitle, { color: theme.fg }]}>Package unavailable</Text><Text style={[styles.status, { color: theme.muted }]}>The package could not be loaded for your selected course.</Text><Pressable onPress={() => query.refetch()} style={[styles.retry, { backgroundColor: theme.goldSoft }]}><Text style={[styles.retryText, { color: theme.goldStrong }]}>Try again</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <Header title="Package details" onBack={goBack} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.heroTop}>
          <View style={[styles.packageIcon, { backgroundColor: theme.goldSoft }]}>{item.access.owned ? <PackageCheck size={25} color={theme.goldStrong} /> : <ShoppingBag size={25} color={theme.goldStrong} />}</View>
          <View style={[styles.accessBadge, { backgroundColor: item.access.owned ? theme.successSoft : theme.goldSoft }]}>{item.access.owned ? <PackageCheck size={13} color={theme.success} /> : <LockKeyhole size={13} color={theme.goldStrong} />}<Text style={[styles.accessText, { color: item.access.owned ? theme.success : theme.goldStrong }]}>{item.access.owned ? 'OWNED' : 'PREVIEW ONLY'}</Text></View>
        </View>
        <Text style={[styles.eyebrow, { color: theme.goldStrong }]}>{item.course?.name ?? 'STUDY PACKAGE'}</Text>
        <Text style={[styles.title, { color: theme.fg }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.muted }]}>{item.description?.trim() || 'A structured collection of study material prepared for this course.'}</Text>
        <View style={[styles.priceRow, { borderTopColor: theme.line }]}><View style={styles.counts}><Text style={[styles.count, { color: theme.fg }]}>{item.noteCount ?? item.itemCount}</Text><Text style={[styles.countLabel, { color: theme.muted }]}>notes</Text></View><View style={styles.counts}><Text style={[styles.count, { color: theme.fg }]}>{item.questionBankCount ?? item.questionBanks?.length ?? 0}</Text><Text style={[styles.countLabel, { color: theme.muted }]}>question banks</Text></View></View>
      </View>

      {!item.access.owned ? <View style={[styles.lockNotice, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}><LockKeyhole size={20} color={theme.goldStrong} /><View style={styles.flex}><Text style={[styles.lockTitle, { color: theme.fg }]}>Contents stay protected until purchased</Text><Text style={[styles.lockCopy, { color: theme.muted }]}>You can review every file and folder name here. Opening content requires an active purchase from the Parallax Flow website.</Text></View></View> : null}

      <View style={styles.sectionHead}><View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Notes</Text><Text style={[styles.sectionCopy, { color: theme.muted }]}>Files and folders included in this package</Text></View><Text style={[styles.total, { color: theme.muted }]}>{item.noteCount ?? item.itemCount} notes</Text></View>
      <View style={styles.tree}>{item.contentTree?.length ? item.contentTree.map((node) => <ContentNode key={node.id} node={node} depth={0} owned={item.access.owned} onOpen={openFile} />) : <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.emptyTitle, { color: theme.fg }]}>No published contents</Text><Text style={[styles.emptyCopy, { color: theme.muted }]}>Files added to this package by the administrator will appear here.</Text></View>}</View>

      {item.questionBanks?.length ? <>
        <View style={styles.sectionHead}><View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Question Banks</Text><Text style={[styles.sectionCopy, { color: theme.muted }]}>Practice collections included in this package</Text></View><Text style={[styles.total, { color: theme.muted }]}>{item.questionBanks.length} included</Text></View>
        <View style={styles.tree}>{item.questionBanks.map((bank) => <Pressable key={bank.id} disabled={!item.access.owned} onPress={() => openQuestionBank(bank.id)} style={[styles.node, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.nodeIcon, { backgroundColor: theme.goldSoft }]}><CircleHelp size={19} color={theme.goldStrong} /></View>
          <View style={styles.flex}><Text numberOfLines={2} style={[styles.nodeTitle, { color: theme.fg }]}>{bank.title}</Text><Text numberOfLines={2} style={[styles.nodeMeta, { color: theme.muted }]}>{bank.questionCount} published questions{bank.description ? ` · ${bank.description}` : ''}</Text></View>
          {item.access.owned ? <View style={[styles.practiceAction, { backgroundColor: theme.primarySoft }]}><Play size={13} color={theme.primaryStrong} fill={theme.primaryStrong} /><Text style={[styles.practiceText, { color: theme.primaryStrong }]}>Practice</Text></View> : <LockKeyhole size={15} color={theme.goldStrong} />}
        </Pressable>)}</View>
      </> : null}

      {!item.access.owned ? <Pressable accessibilityRole="link" onPress={browseStore} style={[styles.storeButton, { backgroundColor: theme.goldStrong }]}><View><Text style={styles.storeButtonText}>Get the Package</Text><Text style={styles.storeButtonSub}>View this exact package in the website Store</Text></View><ExternalLink size={20} color="#17120A" /></Pressable> : null}
    </ScrollView>
  </SafeAreaView>;
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { theme } = useAppTheme();
  return <View style={[styles.header, { borderBottomColor: theme.line }]}><Pressable accessibilityLabel="Back to packages" onPress={onBack} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={20} color={theme.fg} /></Pressable><Text numberOfLines={1} style={[styles.headerTitle, { color: theme.fg }]}>{title}</Text></View>;
}

function ContentNode({ node, depth, owned, onOpen }: { node: PackageContentNode; depth: number; owned: boolean; onOpen: (node: PackageContentNode) => void }) {
  const { theme } = useAppTheme();
  const folder = node.kind === 'FOLDER';
  const image = node.mimeType?.startsWith('image/');
  const supported = Boolean(node.mimeType && supportedMimeTypes.has(node.mimeType));
  return <View style={depth ? [styles.nested, { borderLeftColor: theme.line }] : undefined}>
    <Pressable disabled={folder || !owned || !supported} onPress={() => onOpen(node)} style={[styles.node, { backgroundColor: theme.surface, borderColor: theme.line }, !folder && owned && supported && styles.openable]}>
      <View style={[styles.nodeIcon, { backgroundColor: folder ? theme.goldSoft : theme.primarySoft }]}>{folder ? <Folder size={18} color={theme.goldStrong} /> : image ? <FileImage size={18} color={theme.primaryStrong} /> : <FileText size={18} color={theme.primaryStrong} />}</View>
      <View style={styles.flex}><Text numberOfLines={2} style={[styles.nodeTitle, { color: theme.fg }]}>{node.title}</Text><Text numberOfLines={2} style={[styles.nodeMeta, { color: theme.muted }]}>{folder ? `${countFiles(node)} files · ${node.children.length} items` : `${fileType(node.mimeType)}${node.description ? ` · ${node.description}` : ''}`}</Text></View>
      {!owned && !folder ? <LockKeyhole size={15} color={theme.goldStrong} /> : owned && supported && !folder ? <ChevronRight size={17} color={theme.faint} /> : null}
    </Pressable>
    {node.children.map((child) => <ContentNode key={child.id} node={child} depth={depth + 1} owned={owned} onOpen={onOpen} />)}
  </View>;
}

function countFiles(node: PackageContentNode): number { return node.kind === 'FILE' ? 1 : node.children.reduce((sum, child) => sum + countFiles(child), 0); }
function fileType(mimeType: string | null) { if (mimeType === 'application/pdf') return 'PDF note'; if (mimeType?.startsWith('image/')) return 'Image note'; return 'File details'; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 }, status: { maxWidth: 300, fontFamily: font.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' }, errorTitle: { fontFamily: font.bold, fontSize: 18 }, retry: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 20 }, retryText: { fontFamily: font.bold, fontSize: 12 },
  header: { minHeight: 66, borderBottomWidth: 1, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, headerTitle: { flex: 1, fontFamily: font.bold, fontSize: 17 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: spacing.lg, paddingBottom: 54, gap: 18 }, hero: { borderWidth: 1, borderRadius: 22, padding: 18, overflow: 'hidden' }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, packageIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, accessBadge: { minHeight: 29, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, accessText: { fontFamily: font.bold, fontSize: 8, letterSpacing: 0.8 }, eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' }, title: { marginTop: 6, fontFamily: font.extraBold, fontSize: 26, letterSpacing: -0.7 }, description: { marginTop: 8, fontFamily: font.regular, fontSize: 12, lineHeight: 19 }, priceRow: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 22 }, priceLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, price: { marginTop: 4, fontFamily: font.extraBold, fontSize: 20 }, counts: { alignItems: 'center' }, count: { fontFamily: font.bold, fontSize: 16 }, countLabel: { fontFamily: font.regular, fontSize: 9 },
  lockNotice: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, flex: { flex: 1, minWidth: 0 }, lockTitle: { fontFamily: font.bold, fontSize: 12 }, lockCopy: { marginTop: 4, fontFamily: font.regular, fontSize: 10, lineHeight: 16 }, sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionTitle: { fontFamily: font.bold, fontSize: 18 }, sectionCopy: { marginTop: 2, fontFamily: font.regular, fontSize: 10 }, total: { fontFamily: font.semibold, fontSize: 10 }, tree: { gap: 8 }, nested: { marginLeft: 18, paddingLeft: 9, borderLeftWidth: 1, gap: 7, marginTop: 7 }, node: { minHeight: 66, borderWidth: 1, borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, openable: { opacity: 1 }, nodeIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, nodeTitle: { fontFamily: font.bold, fontSize: 12 }, nodeMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 13 }, empty: { minHeight: 130, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center', padding: 22 }, emptyTitle: { fontFamily: font.bold, fontSize: 14 }, emptyCopy: { marginTop: 5, fontFamily: font.regular, fontSize: 10, textAlign: 'center' },
  practiceAction: { minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, practiceText: { fontFamily: font.bold, fontSize: 9 },
  storeButton: { minHeight: 62, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, storeButtonText: { color: '#17120A', fontFamily: font.extraBold, fontSize: 14 }, storeButtonSub: { color: 'rgba(23,18,10,0.68)', fontFamily: font.medium, fontSize: 8, marginTop: 3 },
});
