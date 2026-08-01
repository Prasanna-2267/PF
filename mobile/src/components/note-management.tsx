import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronRight, Clock3, FileText, LockKeyhole, MoreHorizontal, RotateCw, Star, X } from 'lucide-react-native';
import { font } from '@/constants/theme';
import { type Lesson } from '@/lib/demo-catalog';
import { type ReaderStatus, useLessonReaderStore } from '@/lib/lesson-reader-store';
import { useAppTheme } from '@/providers/app-providers';

export function initialReaderStatus(lesson: Lesson): ReaderStatus {
  return { read: Boolean(lesson.completed), favourite: false, revisions: lesson.revisions ?? 0 };
}

export function NoteRow({ lesson, context, onOpen }: { lesson: Lesson; context?: string; onOpen: () => void }) {
  const { theme } = useAppTheme();
  const [showActions, setShowActions] = useState(false);
  // The selector must return the same reference until the store changes. Creating a
  // fallback object inside it makes React's external-store snapshot loop forever on web.
  const storedStatus = useLessonReaderStore((state) => state.byLessonId[lesson.id]);
  const status = storedStatus ?? initialReaderStatus(lesson);
  const accessible = lesson.access === 'free' || lesson.access === 'owned';

  return <>
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${lesson.title}`} onPress={onOpen} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={[styles.icon, { backgroundColor: accessible ? theme.primarySoft : theme.sunken }]}>{accessible ? <FileText color={theme.primary} size={19} /> : <LockKeyhole color={theme.muted} size={18} />}</View>
        <View style={styles.copy}>
          <View style={styles.titleRow}><Text numberOfLines={2} style={[styles.title, { color: theme.fg }]}>{lesson.title}</Text>{status.favourite ? <Star fill={theme.gold} color={theme.gold} size={14} /> : null}</View>
          <Text numberOfLines={1} style={[styles.detail, { color: theme.muted }]}>{context ? `${context} · ` : ''}{lesson.pages} pages</Text>
          {accessible ? <View style={styles.status}><View>{status.read ? <Check color={theme.success} size={12} strokeWidth={3} /> : <Clock3 color={theme.primary} size={12} />}</View><Text style={[styles.statusText, { color: status.read ? theme.success : theme.primary }]}>{status.read ? 'Completed' : 'In progress'}</Text>{status.revisions ? <Text style={[styles.revision, { color: theme.goldStrong }]}>{status.revisions}× revised</Text> : null}</View> : <Text style={[styles.locked, { color: theme.goldStrong }]}>{lesson.price ?? 'Locked'}</Text>}
        </View>
      </Pressable>
      {accessible ? <Pressable accessibilityRole="button" accessibilityLabel={`Manage ${lesson.title}`} onPress={() => setShowActions(true)} style={[styles.more, { backgroundColor: theme.sunken }]}><MoreHorizontal color={theme.muted} size={18} /></Pressable> : <ChevronRight color={theme.faint} size={19} />}
    </View>
    <NoteActionSheet lesson={lesson} visible={showActions} onClose={() => setShowActions(false)} />
  </>;
}

export function NoteActionSheet({ lesson, visible, onClose }: { lesson: Lesson; visible: boolean; onClose: () => void }) {
  const { theme } = useAppTheme();
  const storedStatus = useLessonReaderStore((state) => state.byLessonId[lesson.id]);
  const status = storedStatus ?? initialReaderStatus(lesson);
  const toggleRead = useLessonReaderStore((state) => state.toggleRead);
  const toggleFavourite = useLessonReaderStore((state) => state.toggleFavourite);
  const revise = useLessonReaderStore((state) => state.revise);
  return <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
    <View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={onClose} /><View style={[styles.sheet, { backgroundColor: theme.surface }]}>
      <View style={[styles.handle, { backgroundColor: theme.line }]} />
      <View style={styles.sheetHeader}><View style={styles.sheetHeading}><Text numberOfLines={1} style={[styles.sheetTitle, { color: theme.fg }]}>{lesson.title}</Text><Text style={[styles.sheetSubtitle, { color: theme.muted }]}>Study actions for this note</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close note actions" onPress={onClose} style={[styles.close, { backgroundColor: theme.sunken }]}><X color={theme.muted} size={18} /></Pressable></View>
      <Action icon={<Check color={status.read ? theme.success : theme.primary} size={19} />} iconBackground={status.read ? theme.successSoft : theme.primarySoft} title={status.read ? 'Marked as read' : 'Mark as read'} detail={status.read ? 'Tap to move it back to in progress.' : 'Add it to your completed study.'} border={theme.line} fg={theme.fg} muted={theme.muted} onPress={() => toggleRead(lesson.id, initialReaderStatus(lesson))} />
      <Action icon={<Star fill={status.favourite ? theme.gold : 'transparent'} color={theme.goldStrong} size={18} />} iconBackground={theme.goldSoft} title={status.favourite ? 'Remove from favourites' : 'Add to favourites'} detail="Keep this note in your quick-access list." border={theme.line} fg={theme.fg} muted={theme.muted} onPress={() => toggleFavourite(lesson.id, initialReaderStatus(lesson))} />
      <Action icon={<RotateCw color={theme.primary} size={18} />} iconBackground={theme.primarySoft} title="Revise this note" detail={status.revisions ? `${status.revisions} revisions logged so far.` : 'Log your first revision.'} border={theme.line} fg={theme.fg} muted={theme.muted} onPress={() => revise(lesson.id, initialReaderStatus(lesson))} />
    </View></View>
  </Modal>;
}

function Action({ icon, iconBackground, title, detail, border, fg, muted, onPress }: { icon: ReactNode; iconBackground: string; title: string; detail: string; border: string; fg: string; muted: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { borderTopColor: border }, pressed && styles.pressed]}><View style={[styles.actionIcon, { backgroundColor: iconBackground }]}>{icon}</View><View style={styles.actionCopy}><Text style={[styles.actionTitle, { color: fg }]}>{title}</Text><Text style={[styles.actionDetail, { color: muted }]}>{detail}</Text></View></Pressable>;
}

const styles = StyleSheet.create({
  row: { minHeight: 89, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 }, title: { flex: 1, fontFamily: font.bold, fontSize: 14, lineHeight: 19 }, detail: { fontFamily: font.regular, fontSize: 11, marginTop: 2 }, status: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }, statusText: { fontFamily: font.semibold, fontSize: 10 }, revision: { fontFamily: font.semibold, fontSize: 10, marginLeft: 4 }, locked: { fontFamily: font.bold, fontSize: 10, marginTop: 5 }, more: { height: 31, width: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.84 }, modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(5,9,24,0.6)' }, sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 28, gap: 5 }, handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 8 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }, sheetHeading: { flex: 1, minWidth: 0 }, sheetTitle: { fontFamily: font.bold, fontSize: 16 }, sheetSubtitle: { fontFamily: font.regular, fontSize: 11, marginTop: 2 }, close: { height: 34, width: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, action: { minHeight: 70, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 }, actionIcon: { height: 40, width: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, actionCopy: { flex: 1, minWidth: 0 }, actionTitle: { fontFamily: font.bold, fontSize: 13 }, actionDetail: { fontFamily: font.regular, fontSize: 10, lineHeight: 15, marginTop: 2 },
});
