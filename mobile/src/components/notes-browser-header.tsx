import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { font, spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

export function NotesBrowserHeader({ query, onChangeQuery, onBack, placeholder }: { query: string; onChangeQuery: (value: string) => void; onBack: () => void; placeholder: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft color={theme.fg} size={20} /></Pressable>
    <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line }]}><Search color={theme.muted} size={18} /><TextInput value={query} onChangeText={onChangeQuery} placeholder={placeholder} placeholderTextColor={theme.faint} style={[styles.input, { color: theme.fg }]} />{query ? <Pressable accessibilityLabel="Clear search" onPress={() => onChangeQuery('')} style={[styles.clear, { backgroundColor: theme.sunken }]}><X color={theme.muted} size={14} /></Pressable> : null}</View>
  </View>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minWidth: 0, fontFamily: font.regular, fontSize: 14, paddingVertical: 11 },
  clear: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
