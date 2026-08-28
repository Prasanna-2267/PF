import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type ProtectedImageReaderProps = {
  source: { uri: string; headers?: Record<string, string> };
  onLoadComplete: () => void;
  onError: (error: string) => void;
};

export function ProtectedImageReader({ source, onLoadComplete, onError }: ProtectedImageReaderProps) {
  const [loading, setLoading] = useState(true);
  const { width, height } = useWindowDimensions();

  return <ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.content}
    maximumZoomScale={4}
    minimumZoomScale={1}
    showsHorizontalScrollIndicator={false}
    showsVerticalScrollIndicator={false}
    centerContent
  >
    <Image
      source={source}
      resizeMode="contain"
      style={[styles.image, { width: Math.max(280, width - 24), height: Math.max(420, height - 110) }]}
      onLoad={() => { setLoading(false); onLoadComplete(); }}
      onError={() => { setLoading(false); onError('The protected image could not be loaded. Please reopen the note and try again.'); }}
    />
    {loading ? <View style={styles.loader}><ActivityIndicator color="#7C9CFF" /><Text style={styles.loaderText}>Opening protected image…</Text></View> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#090B0D' },
  content: { flexGrow: 1, minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: 12 },
  image: { minHeight: 420 },
  loader: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#090B0D' },
  loaderText: { color: '#A2A9B2', fontSize: 12 },
});
