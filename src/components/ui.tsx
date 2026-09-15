import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
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
export function AppTextField({ label, error, secureTextEntry = false, ...props }: TextInputProps & { label: string; error?: string }) {
  const { theme } = useAppTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  return <View style={styles.fieldGroup}><Text style={[styles.label, { color: theme.fg }]}>{label}</Text><View style={styles.inputWrap}><TextInput placeholderTextColor={theme.faint} secureTextEntry={secureTextEntry && !passwordVisible} style={[styles.input, secureTextEntry && styles.passwordInput, { color: theme.fg, backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.line }]} {...props} />{secureTextEntry ? <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} accessibilityState={{ expanded: passwordVisible }} hitSlop={4} onPress={() => setPasswordVisible((current) => !current)} style={({ pressed }) => [styles.passwordToggle, pressed && styles.pressed]}>{passwordVisible ? <EyeOff size={19} color={theme.muted} /> : <Eye size={19} color={theme.muted} />}</Pressable> : null}</View>{error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}</View>;
}
export function StatusView({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  const { theme } = useAppTheme();
  return <View style={[styles.status, { borderColor: theme.line, backgroundColor: theme.surface }]}><Text style={[styles.statusTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.statusDescription, { color: theme.muted }]}>{description}</Text>{action ? <View style={styles.statusAction}>{action}</View> : null}</View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm, shadowColor: '#10162F', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  button: { minHeight: 48, borderRadius: radius.field, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontFamily: font.bold, fontSize: 14 }, pressed: { opacity: 0.86 }, disabled: { opacity: 0.55 },
  fieldGroup: { gap: 6 }, label: { fontFamily: font.semibold, fontSize: 13 }, inputWrap: { position: 'relative' }, input: { minHeight: 48, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: spacing.md, fontFamily: font.regular, fontSize: 15 }, passwordInput: { paddingRight: 52 }, passwordToggle: { position: 'absolute', top: 0, right: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, error: { fontFamily: font.medium, fontSize: 12 },
  status: { borderWidth: 1, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center' }, statusTitle: { fontFamily: font.bold, fontSize: 17, textAlign: 'center' }, statusDescription: { marginTop: spacing.xs, fontFamily: font.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' }, statusAction: { marginTop: spacing.lg },
});
