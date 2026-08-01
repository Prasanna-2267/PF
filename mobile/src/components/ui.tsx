import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { font, radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { theme } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }, style]}>{children}</View>;
}
export function AppButton({ label, onPress, variant = 'primary', loading = false, disabled = false }: { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'gold'; loading?: boolean; disabled?: boolean }) {
  const { theme } = useAppTheme();
  const colors = variant === 'gold' ? { backgroundColor: theme.gold, color: '#FFFFFF' } : variant === 'secondary' ? { backgroundColor: theme.primarySoft, color: theme.primary } : { backgroundColor: theme.primary, color: theme.primaryFg };
  return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, colors, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>{loading ? <ActivityIndicator color={colors.color} /> : <Text style={[styles.buttonText, { color: colors.color }]}>{label}</Text>}</Pressable>;
}
export function AppTextField({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.fieldGroup}><Text style={[styles.label, { color: theme.fg }]}>{label}</Text><TextInput placeholderTextColor={theme.faint} style={[styles.input, { color: theme.fg, backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.line }]} {...props} />{error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}</View>;
}
export function StatusView({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  const { theme } = useAppTheme();
  return <View style={[styles.status, { borderColor: theme.line, backgroundColor: theme.surface }]}><Text style={[styles.statusTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.statusDescription, { color: theme.muted }]}>{description}</Text>{action ? <View style={styles.statusAction}>{action}</View> : null}</View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm, shadowColor: '#10162F', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  button: { minHeight: 48, borderRadius: radius.field, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontFamily: font.bold, fontSize: 14 }, pressed: { opacity: 0.86 }, disabled: { opacity: 0.55 },
  fieldGroup: { gap: 6 }, label: { fontFamily: font.semibold, fontSize: 13 }, input: { minHeight: 48, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: spacing.md, fontFamily: font.regular, fontSize: 15 }, error: { fontFamily: font.medium, fontSize: 12 },
  status: { borderWidth: 1, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center' }, statusTitle: { fontFamily: font.bold, fontSize: 17, textAlign: 'center' }, statusDescription: { marginTop: spacing.xs, fontFamily: font.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' }, statusAction: { marginTop: spacing.lg },
});
