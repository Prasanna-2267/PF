import { Redirect, Slot } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { layout } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

export default function StudentLayout() {
  const status = useAuthStore((s) => s.status);
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  if (status !== 'authenticated') return <Redirect href="/login" />;
  const framed = width > layout.studentAppMaxWidth;

  return <View style={[styles.viewport, { backgroundColor: theme.canvas }]}>
    <View style={[styles.appFrame, { backgroundColor: theme.canvas }, framed && { borderColor: theme.line, borderLeftWidth: 1, borderRightWidth: 1 }]}>
      <Slot />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, width: '100%' },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: layout.studentAppMaxWidth,
    minWidth: 0,
    alignSelf: 'center',
  },
});
