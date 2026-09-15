import { useEffect, useState } from 'react';
import { Animated, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { font } from '@/constants/theme';

const NEURALWEB_LABS_URL = 'https://neuralweblabs.com/';

export function PoweredByNeuralWebLabs() {
  const [wave] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(500),
      Animated.timing(wave, {
        toValue: 1,
        duration: 2_200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.delay(500),
    ]));
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
      <View style={styles.brand}>
        <Text style={styles.text}>
          Powered by <Text style={styles.strong}>NeuralWeb Labs</Text>
        </Text>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flash,
            {
              transform: [{
                translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [-80, 280] }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
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
    overflow: 'hidden',
    minWidth: 190,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  text: {
    color: '#72A5F4',
    fontFamily: font.extraBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  strong: {
    color: '#DCEAFF',
    fontFamily: font.extraBold,
  },
  flash: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 0,
    width: 56,
    opacity: 0.75,
    transform: [{ skewX: '-16deg' }],
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
