import { useEffect, useRef, useState } from 'react';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, ChartLine, CircleDot, House, Library } from 'lucide-react-native';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type GestureResponderEvent, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { font, layout, themes } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

const icons = { home: House, notes: BookOpen, practice: CircleDot, tracker: ChartLine, library: Library };
const labels = { home: 'Home', notes: 'Notes', practice: 'Practice', tracker: 'Tracker', library: 'Library' };
const accents = {
  home: { light: '#C8F676', strong: '#A9DD55' },
  notes: { light: '#AFC1FF', strong: '#7895F5' },
  practice: { light: '#F4C76D', strong: '#D9A647' },
  tracker: { light: '#78E1D3', strong: '#3AB9AA' },
  library: { light: '#F49AB7', strong: '#D9668A' },
};
const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(28px) saturate(180%)' } as ViewStyle) : undefined;
const nativeDriver = Platform.OS !== 'web';
const railPadding = 7;
const orbSize = 42;
const glowWidth = 62;

type TabName = keyof typeof icons;
type LiquidTabBarProps = {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  navigation: {
    emit: (event: { type: 'tabPress' | 'tabLongPress'; target: string; canPreventDefault?: boolean }) => unknown;
    navigate: (name: string, params?: object) => void;
  };
};

export function LiquidTabBar({ state, navigation }: LiquidTabBarProps) {
  const { theme } = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const name = useAuthStore((store) => store.user?.name ?? 'Parallax User');
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const visibleRoutes = state.routes.filter((route) => route.name in icons);
  const activeName = (state.routes[state.index]?.name in icons ? state.routes[state.index].name : 'home') as TabName;
  const activeIndex = Math.max(0, visibleRoutes.findIndex((route) => route.name === activeName));
  const [previewIndex, setPreviewIndex] = useState(activeIndex);
  const [dragging, setDragging] = useState(false);
  const previewIndexRef = useRef(activeIndex);
  const displayIndex = dragging ? previewIndex : activeIndex;
  const visualName = (visibleRoutes[displayIndex]?.name ?? activeName) as TabName;
  const ActiveIcon = icons[visualName];
  const accent = accents[visualName];
  const [railWidth, setRailWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(activeIndex));
  const [pop] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));
  const livePosition = useRef(activeIndex);
  const dragOrigin = useRef(activeIndex);
  const dragStartX = useRef(0);
  const totalItems = visibleRoutes.length + 1;
  const cellWidth = railWidth > railPadding * 2 ? (railWidth - railPadding * 2) / totalItems : 0;
  const appWidth = Math.min(viewportWidth, layout.studentAppMaxWidth);
  const responsiveRailWidth = Math.max(0, Math.min(appWidth - 28, layout.studentNavMaxWidth));
  const responsiveRailLeft = Math.max(0, (appWidth - responsiveRailWidth) / 2);

  useEffect(() => {
    previewIndexRef.current = activeIndex;
    pop.setValue(0);
    Animated.parallel([
      Animated.spring(position, { toValue: activeIndex, stiffness: 165, damping: 20, mass: .76, useNativeDriver: nativeDriver }),
      Animated.spring(pop, { toValue: 1, stiffness: 210, damping: 17, mass: .62, useNativeDriver: nativeDriver }),
    ]).start();
  }, [activeIndex, pop, position]);

  useEffect(() => {
    const listener = position.addListener(({ value }) => { livePosition.current = value; });
    return () => position.removeListener(listener);
  }, [position]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(glow, { toValue: 0, duration: 1050, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const onRailLayout = (event: LayoutChangeEvent) => setRailWidth(event.nativeEvent.layout.width);
  const translateX = Animated.multiply(position, cellWidth);
  const orbLeft = railPadding + Math.max(0, (cellWidth - orbSize) / 2);
  const orbLift = pop.interpolate({ inputRange: [0, 1], outputRange: [7, 0] });
  const orbScale = pop.interpolate({ inputRange: [0, .72, 1], outputRange: [.78, 1.08, 1] });
  const orbStretchX = pop.interpolate({ inputRange: [0, .58, 1], outputRange: [1.28, 1.08, 1] });
  const orbStretchY = pop.interpolate({ inputRange: [0, .58, 1], outputRange: [.84, .95, 1] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [.82, 1.18] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [.16, .34] });
  const trailOpacity = pop.interpolate({ inputRange: [0, .72, 1], outputRange: [.34, .14, 0] });
  const trailScaleX = pop.interpolate({ inputRange: [0, .72, 1], outputRange: [1.72, 1.22, .86] });

  const settleOnTab = (index: number) => {
    const nextIndex = Math.max(0, Math.min(visibleRoutes.length - 1, index));
    const route = visibleRoutes[nextIndex];
    previewIndexRef.current = nextIndex;
    setPreviewIndex(nextIndex);
    pop.setValue(.35);
    Animated.parallel([
      Animated.spring(position, { toValue: nextIndex, stiffness: 220, damping: 22, mass: .7, useNativeDriver: nativeDriver }),
      Animated.spring(pop, { toValue: 1, stiffness: 240, damping: 17, mass: .58, useNativeDriver: nativeDriver }),
    ]).start(() => setDragging(false));

    if (!route || route.name === activeName) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }) as { defaultPrevented?: boolean };
    if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  const beginBeadDrag = (event: GestureResponderEvent) => {
    dragStartX.current = event.nativeEvent.pageX;
    dragOrigin.current = livePosition.current;
    previewIndexRef.current = Math.round(livePosition.current);
    setPreviewIndex(previewIndexRef.current);
    setDragging(true);
    position.stopAnimation((value) => {
      livePosition.current = value;
      dragOrigin.current = value;
    });
    pop.setValue(.7);
  };

  const moveBead = (event: GestureResponderEvent) => {
    if (cellWidth <= 0) return;
    const distance = event.nativeEvent.pageX - dragStartX.current;
    const nextPosition = Math.max(0, Math.min(visibleRoutes.length - 1, dragOrigin.current + distance / cellWidth));
    position.setValue(nextPosition);
    const nextPreview = Math.round(nextPosition);
    if (nextPreview !== previewIndexRef.current) {
      previewIndexRef.current = nextPreview;
      setPreviewIndex(nextPreview);
    }
  };

  const finishBeadDrag = () => settleOnTab(Math.round(livePosition.current));

  return <View pointerEvents="box-none" style={[styles.positioner, { left: responsiveRailLeft, width: responsiveRailWidth }]}>
    <Animated.View pointerEvents="none" style={[styles.activeGlow, { left: railPadding + Math.max(0, (cellWidth - glowWidth) / 2), backgroundColor: accent.strong, opacity: glowOpacity, transform: [{ translateX }, { scale: glowScale }] }]} />
    <Animated.View pointerEvents="none" style={[styles.motionTrail, { left: orbLeft - 8, backgroundColor: accent.strong, opacity: trailOpacity, transform: [{ translateX }, { scaleX: trailScaleX }] }]} />

    <View onLayout={onRailLayout} style={[styles.glassShell, { borderColor: dark ? 'rgba(185,199,255,.25)' : 'rgba(255,255,255,.92)' }, webBlur]}>
      <GlassView glassEffectStyle="regular" tintColor={dark ? 'rgba(12,15,21,.78)' : 'rgba(246,249,255,.74)'} colorScheme={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <LinearGradient pointerEvents="none" colors={dark ? ['rgba(38,31,53,.92)', 'rgba(15,15,26,.95)', 'rgba(8,10,14,.98)'] : ['rgba(255,255,255,.96)', 'rgba(235,240,252,.82)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.topSheen, { backgroundColor: dark ? 'rgba(207,216,255,.34)' : '#FFFFFF' }]} />
      <View style={styles.items}>
        {visibleRoutes.map((route, index) => {
          const routeName = route.name as TabName;
          const Icon = icons[routeName];
          const focused = displayIndex === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }) as { defaultPrevented?: boolean };
            if (activeIndex !== index && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
          return <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={labels[routeName]} testID={`tab-${routeName}`} onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            {focused ? <View style={styles.activeAnchor}><Text numberOfLines={1} style={[styles.activeLabel, { color: accent.light }]}>{labels[routeName]}</Text></View> : <View style={styles.inactiveIcon}><Icon size={19} color={theme.muted} strokeWidth={1.8} /></View>}
          </Pressable>;
        })}
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/account')} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><View style={[styles.profileMark, { borderColor: theme.lineStrong }]}><Text style={[styles.profileInitials, { color: theme.muted }]}>{initials}</Text></View></Pressable>
      </View>
    </View>

    {railWidth > 0 ? <Animated.View accessibilityRole="adjustable" accessibilityLabel={`${labels[visualName]} tab. Drag to change tabs.`} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={beginBeadDrag} onResponderMove={moveBead} onResponderRelease={finishBeadDrag} onResponderTerminate={finishBeadDrag} style={[styles.activeOrb, { left: orbLeft, borderColor: dark ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.9)', transform: [{ translateX }, { translateY: orbLift }, { scale: orbScale }, { scaleX: orbStretchX }, { scaleY: orbStretchY }] }]}><LinearGradient colors={[accent.light, accent.strong]} start={{ x: .18, y: 0 }} end={{ x: .82, y: 1 }} style={styles.activeOrbFill}><ActiveIcon size={19} color="#101117" strokeWidth={2.2} /></LinearGradient></Animated.View> : null}
  </View>;
}

const styles = StyleSheet.create({
  positioner: { position: 'absolute', bottom: 8, height: 80 },
  glassShell: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, zIndex: 1, borderRadius: 19, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(12,15,20,.78)' },
  topSheen: { position: 'absolute', top: 0, left: 17, right: 17, height: 1 },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: railPadding, paddingTop: 7, paddingBottom: 3 },
  item: { flex: 1, height: 49, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  inactiveIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  activeAnchor: { height: 39, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  activeLabel: { maxWidth: 54, fontFamily: font.bold, fontSize: 7, lineHeight: 10, letterSpacing: .15, textAlign: 'center' },
  activeOrb: { position: 'absolute', top: 4, width: orbSize, height: orbSize, zIndex: 4, borderRadius: orbSize / 2, borderWidth: 1, padding: 2, backgroundColor: '#14131C' },
  activeOrbFill: { flex: 1, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  activeGlow: { position: 'absolute', top: 32, width: glowWidth, height: 28, borderRadius: 31, zIndex: 0 },
  motionTrail: { position: 'absolute', top: 13, width: orbSize + 16, height: orbSize - 8, borderRadius: orbSize / 2, zIndex: 2 },
  profileMark: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontFamily: font.bold, fontSize: 8 },
  pressed: { opacity: .72, transform: [{ scale: .94 }] },
});
