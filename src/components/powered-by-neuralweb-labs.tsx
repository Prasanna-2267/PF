import { useEffect, useState } from 'react';
import { Animated, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { font } from '@/constants/theme';
import { NEURALWEB_LABS_URL } from '@/lib/env';

const BRAND_WIDTH = 190;
const SPLASH_BRAND_WIDTH = 228;
const WARM_BRAND_WIDTH = 172;
const darkWave = ['#397CE2', '#7BAAFF', '#FFFFFF', '#7BAAFF', '#397CE2', '#7BAAFF', '#FFFFFF', '#7BAAFF', '#397CE2'] as const;
const lightWave = ['#176392', '#5FA6D0', '#FFF4CE', '#C17A16', '#176392', '#5FA6D0', '#FFF4CE', '#C17A16', '#176392'] as const;
const warmWave = ['#FF7A35', '#F0B84E', '#FFF1B8', '#FFB13B', '#FF7A35', '#F0B84E', '#FFF1B8', '#FFB13B', '#FF7A35'] as const;

export function PoweredByNeuralWebLabs({ surface = 'dark' }: { surface?: 'dark' | 'light' | 'warm' }) {
  const [wave] = useState(() => new Animated.Value(0));
  const lightSurface = surface === 'light';
  const warmSurface = surface === 'warm';
  const brandWidth = lightSurface ? SPLASH_BRAND_WIDTH : warmSurface ? WARM_BRAND_WIDTH : BRAND_WIDTH;
  const colors = lightSurface ? lightWave : warmSurface ? warmWave : darkWave;
  const textStyle = [styles.text, lightSurface && styles.lightText, warmSurface && styles.warmText];

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
      disabled={!NEURALWEB_LABS_URL}
      onPress={() => { if (NEURALWEB_LABS_URL) void Linking.openURL(NEURALWEB_LABS_URL); }}
      style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]}
    >
      <View style={[styles.brand, { width: brandWidth }]}>
        <Text style={textStyle}>Powered by NeuralWeb Labs</Text>
        <MaskedView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          maskElement={<View style={styles.mask}><Text style={textStyle}>Powered by NeuralWeb Labs</Text></View>}
        >
          <Animated.View style={[styles.track, {
            width: brandWidth * 3,
            transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [-brandWidth * 2, 0] }) }],
          }]}
          >
            <LinearGradient
              colors={colors}
              locations={[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </MaskedView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: { alignSelf: 'center', minWidth: 210, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  brand: { width: BRAND_WIDTH, height: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mask: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#397CE2', fontFamily: font.extraBold, fontSize: 12, letterSpacing: 0.36 },
  lightText: { color: '#176392', fontSize: 13.5, letterSpacing: 0.42 },
  warmText: { color: '#F0B84E', fontSize: 10, letterSpacing: 0.3 },
  track: { height: 30 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
