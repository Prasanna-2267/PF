import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { PoweredByNeuralWebLabs } from '@/components/powered-by-neuralweb-labs';

const launchLogo = require('../../assets/images/splash-eye.png');

export function AppLaunchScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(244, width * 0.58);
  const [entrance] = useState(() => new Animated.Value(0));
  const [ruleReveal] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const reveal = Animated.timing(entrance, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const rulePulse = Animated.loop(Animated.sequence([
      Animated.timing(ruleReveal, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(260),
      Animated.timing(ruleReveal, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(180),
    ]));
    reveal.start();
    rulePulse.start();
    return () => { reveal.stop(); rulePulse.stop(); };
  }, [entrance, ruleReveal]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.center}>
        <Animated.View style={{
          transform: [
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        }}>
          <Image source={launchLogo} resizeMode="contain" style={{ width: logoSize, height: logoSize }} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.poweredBy, {
        opacity: entrance,
        transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }]}>
        <View style={styles.footerRuleTrack}>
          <Animated.View style={[styles.footerRule, {
            opacity: ruleReveal.interpolate({ inputRange: [0, 1], outputRange: [0.48, 1] }),
            transform: [{ scaleX: ruleReveal.interpolate({ inputRange: [0, 1], outputRange: [0.08, 1] }) }],
          }]} />
        </View>
        <PoweredByNeuralWebLabs surface="light" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E5E6E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredBy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 34,
    alignItems: 'center',
  },
  footerRuleTrack: {
    width: 76,
    height: 2,
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRule: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: '#AD6B13',
  },
});
