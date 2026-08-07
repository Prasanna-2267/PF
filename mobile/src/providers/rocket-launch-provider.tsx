import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { font } from '@/constants/theme';

type RocketLaunchContextValue = { launchTo: (destination: '/home') => void; isLaunching: boolean };
const RocketLaunchContext = createContext<RocketLaunchContextValue | null>(null);
const useNativeMotion = Platform.OS !== 'web';

const smokeParticles = [
  { x: -78, size: 42, drift: -28, delay: 0, tone: '#CBD4DA' }, { x: -46, size: 34, drift: -42, delay: 170, tone: '#FFFFFF' },
  { x: -18, size: 48, drift: -18, delay: 330, tone: '#AAB6BE' }, { x: 18, size: 43, drift: 24, delay: 90, tone: '#E7ECEF' },
  { x: 48, size: 35, drift: 45, delay: 260, tone: '#BBC5CB' }, { x: 78, size: 45, drift: 31, delay: 420, tone: '#F7F9FA' },
  { x: -98, size: 29, drift: -52, delay: 510, tone: '#8D9AA3' }, { x: 98, size: 31, drift: 55, delay: 570, tone: '#DCE3E7' },
] as const;

export function RocketLaunchProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'READY' | 'IGNITION' | 'LIFTOFF'>('READY');
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [arrival] = useState(() => new Animated.Value(0));
  const [lift] = useState(() => new Animated.Value(0));
  const [curtain] = useState(() => new Animated.Value(0));
  const [flame] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));
  const [copy] = useState(() => new Animated.Value(0));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const launchTo = useCallback((destination: '/home') => {
    if (running.current) return;
    running.current = true;
    setVisible(true);
    setPhase('READY');
    arrival.setValue(0);
    lift.setValue(0);
    curtain.setValue(0);
    flame.setValue(0);
    shake.setValue(0);
    copy.setValue(0);

    const flameLoop = Animated.loop(Animated.sequence([
      Animated.timing(flame, { toValue: 1, duration: 135, easing: Easing.inOut(Easing.quad), useNativeDriver: useNativeMotion }),
      Animated.timing(flame, { toValue: 0, duration: 115, easing: Easing.inOut(Easing.quad), useNativeDriver: useNativeMotion }),
    ]));
    const shakeLoop = Animated.loop(Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 72, useNativeDriver: useNativeMotion }),
      Animated.timing(shake, { toValue: -1, duration: 72, useNativeDriver: useNativeMotion }),
      Animated.timing(shake, { toValue: 0, duration: 72, useNativeDriver: useNativeMotion }),
    ]));
    flameLoop.start();
    shakeLoop.start();
    Animated.parallel([
      Animated.spring(arrival, { toValue: 1, damping: 12, stiffness: 78, mass: .92, useNativeDriver: useNativeMotion }),
      Animated.timing(copy, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: useNativeMotion }),
      Animated.timing(lift, { toValue: 1, duration: 2200, delay: 900, easing: Easing.in(Easing.cubic), useNativeDriver: useNativeMotion }),
      Animated.timing(curtain, { toValue: 1, duration: 1550, delay: 1320, easing: Easing.inOut(Easing.cubic), useNativeDriver: useNativeMotion }),
    ]).start();

    timers.current = [
      setTimeout(() => setPhase('IGNITION'), 430),
      setTimeout(() => setPhase('LIFTOFF'), 920),
      setTimeout(() => router.replace(destination), 520),
      setTimeout(() => {
        flameLoop.stop();
        shakeLoop.stop();
        running.current = false;
        setVisible(false);
      }, 3180),
    ];
  }, [arrival, copy, curtain, flame, lift, router, shake]);

  return <RocketLaunchContext.Provider value={{ launchTo, isLaunching: visible }}><View style={styles.provider}>{children}{visible ? <View style={styles.overlay}>
    <StatusBar style="light" />
    <Animated.View style={[styles.curtain, { transform: [{ translateY: curtain.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + 130)] }) }] }]}>
      <LinearGradient colors={['#061B2B', '#04111C', '#02070B', '#000000']} locations={[0, .38, .72, 1]} style={styles.gradient} />
      <View style={styles.stars}>{Array.from({ length: 24 }, (_, index) => <View key={index} style={[styles.star, { left: `${(index * 37) % 96}%`, top: `${7 + ((index * 53) % 68)}%`, width: index % 5 === 0 ? 3 : 1.5, height: index % 5 === 0 ? 3 : 1.5, opacity: .25 + ((index % 4) * .14) }]} />)}</View>
      <View style={styles.horizonGlow} />
    </Animated.View>

    <Animated.View style={[styles.launchCopy, { opacity: Animated.multiply(copy, lift.interpolate({ inputRange: [0, .48, .74], outputRange: [1, 1, 0], extrapolate: 'clamp' })), transform: [{ translateY: Animated.add(copy.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }), lift.interpolate({ inputRange: [0, 1], outputRange: [0, -36] })) }] }]}>
      <Text style={styles.launchEyebrow}>{phase}</Text>
      <Text style={styles.launchTitle}>{phase === 'READY' ? 'Your journey is ready.' : phase === 'IGNITION' ? 'Firing up your study space.' : 'Welcome to Parallax Flow.'}</Text>
      <Text style={styles.launchDescription}>{phase === 'LIFTOFF' ? 'Your dashboard is now live.' : 'Personalisation saved · preparing launch'}</Text>
    </Animated.View>

    <Animated.View style={[styles.groundSmoke, { opacity: curtain.interpolate({ inputRange: [0, .65, 1], outputRange: [1, .8, 0] }) }]}>{smokeParticles.map((particle, index) => <SmokeParticle key={`ground-${index}`} {...particle} />)}</Animated.View>

    <Animated.View style={[styles.rocketStage, { transform: [
      { translateY: Animated.add(arrival.interpolate({ inputRange: [0, 1], outputRange: [270, 0] }), lift.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + 330)] })) },
      { translateX: shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-2.4, 0, 2.4] }) },
      { rotate: shake.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-.7deg', '0deg', '.7deg'] }) },
      { scale: lift.interpolate({ inputRange: [0, .55, 1], outputRange: [1, 1.02, .72] }) },
    ] }]}>
      <View style={styles.smokeField}>{smokeParticles.map((particle, index) => <SmokeParticle key={index} {...particle} />)}</View>
      <Animated.View style={[styles.flame, { opacity: flame.interpolate({ inputRange: [0, 1], outputRange: [.86, 1] }), transform: [{ scaleY: flame.interpolate({ inputRange: [0, 1], outputRange: [.82, 1.16] }) }, { scaleX: flame.interpolate({ inputRange: [0, 1], outputRange: [1.08, .9] }) }] }]}><RocketFlame /></Animated.View>
      <RocketVehicle />
    </Animated.View>

    <Animated.View style={[styles.launchPad, { opacity: curtain.interpolate({ inputRange: [0, .62, 1], outputRange: [1, .9, 0] }) }]}><View style={styles.padGlow} /><View style={styles.padTop} /><View style={styles.padBase} /></Animated.View>
  </View> : null}</View></RocketLaunchContext.Provider>;
}

export function useRocketLaunch() {
  const value = useContext(RocketLaunchContext);
  if (!value) throw new Error('useRocketLaunch must be used inside RocketLaunchProvider');
  return value;
}

function SmokeParticle({ x, size, drift, delay, tone }: { x: number; size: number; drift: number; delay: number; tone: string }) {
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(motion, { toValue: 1, duration: 880, easing: Easing.out(Easing.quad), useNativeDriver: useNativeMotion }),
      Animated.timing(motion, { toValue: 0, duration: 1, useNativeDriver: useNativeMotion }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, motion]);
  return <Animated.View style={[styles.smoke, { width: size, height: size, borderRadius: size / 2, backgroundColor: tone, left: 116 + x, opacity: motion.interpolate({ inputRange: [0, .18, .7, 1], outputRange: [0, .78, .34, 0] }), transform: [{ translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) }, { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, 92] }) }, { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [.4, 1.55] }) }] }]} />;
}

function RocketVehicle() {
  return <Svg width={170} height={238} viewBox="0 0 170 238">
    <Defs><SvgLinearGradient id="body" x1="0" y1="0" x2="1" y2="1"><Stop offset="0%" stopColor="#FFFFFF" /><Stop offset="55%" stopColor="#DDE7F0" /><Stop offset="100%" stopColor="#91A9BB" /></SvgLinearGradient><SvgLinearGradient id="fin" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#FFB32F" /><Stop offset="100%" stopColor="#E96820" /></SvgLinearGradient></Defs>
    <G>
      <Path d="M85 8 C54 34 43 79 48 145 L59 190 H111 L122 145 C127 79 116 34 85 8Z" fill="url(#body)" stroke="#C7D7E2" strokeWidth="2" />
      <Path d="M85 8 C74 20 68 33 65 46 H105 C102 33 96 20 85 8Z" fill="#FF8B24" />
      <Path d="M49 126 C25 143 18 173 20 207 L59 181 L59 145Z" fill="url(#fin)" stroke="#FFAE32" strokeWidth="2" />
      <Path d="M121 126 C145 143 152 173 150 207 L111 181 L111 145Z" fill="url(#fin)" stroke="#FFAE32" strokeWidth="2" />
      <Path d="M67 190 L103 190 L109 211 H61Z" fill="#667D8D" stroke="#A9BBC8" strokeWidth="2" />
      <Circle cx="85" cy="91" r="24" fill="#102F49" stroke="#69D7FF" strokeWidth="5" />
      <Circle cx="85" cy="91" r="15" fill="#4BC8F3" opacity=".62" />
      <Circle cx="78" cy="84" r="5" fill="#D9F7FF" opacity=".82" />
      <Path d="M62 151 H108" stroke="#8BA1B1" strokeWidth="2" opacity=".7" />
      <Path d="M85 118 V163" stroke="#ABBCC8" strokeWidth="2" opacity=".55" />
      <Path d="M72 171 H98" stroke="#62798A" strokeWidth="4" strokeLinecap="round" />
    </G>
  </Svg>;
}

function RocketFlame() {
  return <Svg width={78} height={130} viewBox="0 0 78 130"><Path d="M39 3 C62 31 68 68 56 116 C51 103 46 97 39 126 C32 97 27 103 22 116 C10 68 16 31 39 3Z" fill="#FF5A1F" /><Path d="M39 27 C54 52 55 80 47 112 C44 101 41 94 39 121 C37 94 34 101 31 112 C23 80 24 52 39 27Z" fill="#FFB31F" /><Path d="M39 54 C47 71 46 90 42 108 C41 99 40 94 39 115 C38 94 37 99 36 108 C32 90 31 71 39 54Z" fill="#FFF2A6" /></Svg>;
}

const styles = StyleSheet.create({
  provider: { flex: 1 }, overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, elevation: 9999, overflow: 'hidden', backgroundColor: 'transparent' },
  curtain: { position: 'absolute', top: 0, right: 0, left: 0, height: '115%', overflow: 'hidden' }, gradient: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, stars: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, star: { position: 'absolute', borderRadius: 2, backgroundColor: '#D9F4FF' }, horizonGlow: { position: 'absolute', width: 520, height: 180, borderRadius: 260, backgroundColor: 'rgba(45,179,220,.12)', alignSelf: 'center', bottom: -100 },
  launchCopy: { position: 'absolute', top: '11%', left: 24, right: 24, alignItems: 'center', zIndex: 4 }, launchEyebrow: { color: '#F3B64E', fontFamily: font.extraBold, fontSize: 9, letterSpacing: 2 }, launchTitle: { marginTop: 8, color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 25, lineHeight: 31, letterSpacing: -.7, textAlign: 'center' }, launchDescription: { marginTop: 5, color: '#9CB0BE', fontFamily: font.medium, fontSize: 10, textAlign: 'center' },
  rocketStage: { position: 'absolute', width: 270, height: 390, bottom: 37, alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-start', zIndex: 6 }, flame: { position: 'absolute', top: 194, zIndex: 1, transformOrigin: 'top' }, smokeField: { position: 'absolute', width: 270, height: 210, top: 230, left: 0, zIndex: 0 }, groundSmoke: { position: 'absolute', width: 270, height: 180, bottom: 20, alignSelf: 'center', zIndex: 5 }, smoke: { position: 'absolute', top: 8 },
  launchPad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, alignItems: 'center', justifyContent: 'flex-end', zIndex: 3 }, padGlow: { position: 'absolute', bottom: -32, width: 310, height: 105, borderRadius: 155, backgroundColor: 'rgba(255,126,31,.19)' }, padTop: { width: 230, height: 10, borderRadius: 5, backgroundColor: '#45515A' }, padBase: { width: 295, height: 28, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: '#1A2229', borderTopWidth: 2, borderTopColor: '#6A7780' },
});
