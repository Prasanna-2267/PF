import { useEffect, useState } from 'react';
import { Animated, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { font } from '@/constants/theme';

const NEURALWEB_LABS_URL = 'https://neuralweblabs.com/';
const BRAND_WIDTH = 190;
const SPLASH_BRAND_WIDTH = 228;
const WARM_BRAND_WIDTH = 162;
const darkSurfaceColors = ['#397CE2', '#7BAAFF', '#FFFFFF', '#7BAAFF', '#397CE2'] as const;
const lightSurfaceColors = ['#091F36', '#176392', '#9B5B0A', '#C17A16', '#176392', '#091F36'] as const;
const warmSurfaceColors = ['#F0B84E', '#FF7A35', '#FFF1B8', '#FFB13B', '#F0B84E'] as const;

export function PoweredByNeuralWebLabs({ surface = 'dark' }: { surface?: 'dark' | 'light' | 'warm' }) {
  const [wave] = useState(() => new Animated.Value(0));
  const lightSurface = surface === 'light';
  const warmSurface = surface === 'warm';
  const brandWidth = lightSurface ? SPLASH_BRAND_WIDTH : warmSurface ? WARM_BRAND_WIDTH : BRAND_WIDTH;
  const gradientColors = lightSurface ? lightSurfaceColors : warmSurface ? warmSurfaceColors : darkSurfaceColors;

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(wave, {
      toValue: 1,
      duration: 3_000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [wave]);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Powered by NeuralWeb Labs"
      onPress={() => void Linking.openURL(NEURALWEB_LABS_URL)}
      style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]}
    >
      <MaskedView
        style={[styles.brand, { width: brandWidth }]}
        maskElement={(
          <View style={styles.mask}>
            <Text style={[styles.maskText, lightSurface && styles.lightSurfaceText, warmSurface && styles.warmSurfaceText]}>Powered by NeuralWeb Labs</Text>
          </View>
        )}
      >
        <Animated.View
          style={[
            styles.gradientTrack,
            {
              width: brandWidth * 2,
              transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -brandWidth] }) }],
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </MaskedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignSelf: 'center',
    minWidth: 210,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    width: BRAND_WIDTH,
    height: 30,
  },
  mask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskText: {
    color: '#000000',
    fontFamily: font.extraBold,
    fontSize: 12,
    letterSpacing: 0.36,
  },
  lightSurfaceText: {
    fontSize: 13.5,
    letterSpacing: 0.42,
  },
  warmSurfaceText: {
    fontSize: 9.5,
    letterSpacing: 0.28,
  },
  gradientTrack: {
    height: 30,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
