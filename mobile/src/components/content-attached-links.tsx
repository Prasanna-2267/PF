import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink, Link2, X } from 'lucide-react-native';
import { font } from '@/constants/theme';
import type { ContentAttachedLink } from '@/lib/note-viewer-api';
import { useAppTheme } from '@/providers/app-providers';

export function ContentAttachedLinks({ links }: { links: ContentAttachedLink[] }) {
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  if (!links.length) return null;

  const open = async (url: string) => {
    setError('');
    try {
      await Linking.openURL(url);
    } catch {
      setError('This link could not be opened on your device.');
    }
  };

  const resourceCards = links.map((link) => <View key={link.id} style={[styles.linkCard, { backgroundColor: theme.sunken, borderColor: theme.line }]}>
    <Text style={[styles.description, { color: theme.fg }]}>{link.description}</Text>
    <Text numberOfLines={2} ellipsizeMode="middle" style={[styles.url, { color: theme.muted }]}>{link.url}</Text>
    <Pressable accessibilityRole="link" onPress={() => void open(link.url)} style={[styles.openButton, { backgroundColor: theme.primaryStrong }]}><Text style={styles.openText}>Open link</Text><ExternalLink color="#081018" size={14} /></Pressable>
  </View>);

  if (links.length > 1) {
    return <>
      <View style={[styles.shell, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${links.length} attached resources`} onPress={() => setExpanded(true)} style={styles.toggle}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><Link2 color={theme.primaryStrong} size={17} /></View>
          <View style={styles.copy}><Text style={[styles.eyebrow, { color: theme.primaryStrong }]}>ATTACHED RESOURCES</Text><Text style={[styles.title, { color: theme.fg }]}>{links.length} links attached</Text></View>
          <ChevronUp color={theme.muted} size={18} />
        </Pressable>
      </View>
      <Modal transparent visible={expanded} animationType="slide" statusBarTranslucent onRequestClose={() => setExpanded(false)}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Close attached resources" style={StyleSheet.absoluteFill} onPress={() => setExpanded(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.line }]} />
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: theme.primarySoft }]}><Link2 color={theme.primaryStrong} size={19} /></View>
              <View style={styles.copy}><Text style={[styles.sheetTitle, { color: theme.fg }]}>Attached Resources</Text><Text style={[styles.sheetHint, { color: theme.muted }]}>{links.length} links available</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close attached resources" onPress={() => setExpanded(false)} style={[styles.closeButton, { backgroundColor: theme.sunken }]}><X color={theme.muted} size={19} /></Pressable>
            </View>
            <ScrollView style={styles.sheetList} contentContainerStyle={styles.sheetListContent} showsVerticalScrollIndicator={false}>{resourceCards}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</ScrollView>
          </View>
        </View>
      </Modal>
    </>;
  }

  return <View style={[styles.shell, { backgroundColor: theme.surface, borderColor: theme.line }]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.toggle}>
      <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><Link2 color={theme.primaryStrong} size={17} /></View>
      <View style={styles.copy}><Text style={[styles.eyebrow, { color: theme.primaryStrong }]}>ATTACHED RESOURCE</Text><Text numberOfLines={1} style={[styles.title, { color: theme.fg }]}>{links.length === 1 ? links[0].description : `${links.length} useful links`}</Text></View>
      {expanded ? <ChevronDown color={theme.muted} size={18} /> : <ChevronUp color={theme.muted} size={18} />}
    </Pressable>
    {expanded ? <ScrollView style={styles.list} contentContainerStyle={styles.listContent} nestedScrollEnabled showsVerticalScrollIndicator={false}>
      {resourceCards}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </ScrollView> : null}
  </View>;
}

const styles = StyleSheet.create({
  shell: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  toggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 },
  title: { marginTop: 3, fontFamily: font.semibold, fontSize: 12 },
  list: { maxHeight: 190 },
  listContent: { gap: 8, paddingTop: 7, paddingBottom: 3 },
  linkCard: { borderWidth: 1, borderRadius: 13, padding: 11 },
  description: { fontFamily: font.semibold, fontSize: 12, lineHeight: 17 },
  url: { marginTop: 4, fontFamily: font.regular, fontSize: 10, lineHeight: 14 },
  openButton: { alignSelf: 'flex-start', minHeight: 32, marginTop: 9, borderRadius: 10, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  openText: { color: '#081018', fontFamily: font.bold, fontSize: 10 },
  error: { color: '#F97066', fontFamily: font.medium, fontSize: 10, lineHeight: 14 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.66)' },
  sheet: { maxHeight: '72%', borderTopWidth: 1, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 16, paddingBottom: 24 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, marginTop: 9, marginBottom: 13 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 14 },
  sheetIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: font.bold, fontSize: 17, lineHeight: 22 },
  sheetHint: { marginTop: 2, fontFamily: font.regular, fontSize: 11 },
  closeButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sheetList: { flexGrow: 0 },
  sheetListContent: { gap: 10, paddingBottom: 8 },
});
