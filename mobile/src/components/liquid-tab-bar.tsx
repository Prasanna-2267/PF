import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, ChartLine, CircleDot, House, Library } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { font, themes } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

const icons = { home: House, notes: BookOpen, practice: CircleDot, tracker: ChartLine, library: Library };
const labels = { home: 'Home', notes: 'Notes', practice: 'Practice', tracker: 'Tracker', library: 'Library' };
const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(28px) saturate(180%)' } as ViewStyle) : undefined;
type LiquidTabBarProps = {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  navigation: {
    emit: (event: { type: 'tabPress' | 'tabLongPress'; target: string; canPreventDefault?: boolean }) => unknown;
    navigate: (name: string, params?: object) => void;
  };
};

export function LiquidTabBar({ state, navigation }: LiquidTabBarProps) {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const name = useAuthStore((store) => store.user?.name ?? 'Parallax User');
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return <View pointerEvents="box-none" style={styles.positioner}>
      <View style={[styles.glassShell, { borderColor: dark ? 'rgba(185,199,255,0.28)' : 'rgba(255,255,255,0.92)' }, webBlur]}>
        <GlassView glassEffectStyle="regular" tintColor={dark ? 'rgba(12,15,21,0.72)' : 'rgba(246,249,255,0.68)'} colorScheme={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={dark ? ['rgba(255,255,255,0.10)', 'rgba(19,23,31,0.76)', 'rgba(8,10,14,0.94)'] : ['rgba(255,255,255,0.94)', 'rgba(235,240,252,0.74)']} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[styles.topSheen, { backgroundColor: dark ? 'rgba(207,216,255,0.42)' : '#FFFFFF' }]} />
        <View style={styles.items}>
          {state.routes.map((route, index) => {
            const name = route.name as keyof typeof icons;
            const Icon = icons[name];
            if (!Icon) return null;
            const focused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }) as { defaultPrevented?: boolean };
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

            return <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={labels[name]} testID={`tab-${name}`} onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <View style={[styles.iconWell, focused && { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.62)' : theme.lineStrong }]}>
                <Icon size={20} color={focused ? theme.primaryStrong : theme.muted} strokeWidth={focused ? 2.6 : 2} />
              </View>
              <Text numberOfLines={1} style={[styles.label, { color: focused ? theme.primaryStrong : theme.muted }]}>{labels[name]}</Text>
            </Pressable>;
          })}
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/account')} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><View style={[styles.iconWell, { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.62)' : theme.lineStrong }]}><Text style={[styles.profileInitials, { color: theme.primaryStrong }]}>{initials}</Text></View><Text style={[styles.label, { color: theme.muted }]}>Profile</Text></Pressable>
        </View>
      </View>
  </View>;
}

const styles = StyleSheet.create({
  positioner: { position: 'absolute', left: 12, right: 12, bottom: 9, height: 74 },
  glassShell: { flex: 1, borderRadius: 27, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(12,15,20,0.72)' },
  topSheen: { position: 'absolute', top: 0, left: 18, right: 18, height: 1 },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingTop: 5, paddingBottom: 4 },
  item: { flex: 1, height: 61, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  iconWell: { width: 43, height: 31, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontFamily: font.bold, fontSize: 9 },
  label: { marginTop: 3, fontFamily: font.semibold, fontSize: 8, lineHeight: 12, textAlign: 'center' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
