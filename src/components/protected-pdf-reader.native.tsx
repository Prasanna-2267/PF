import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Constants from 'expo-constants';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const runningInExpoGo = Constants.expoGoConfig !== null;

type ProtectedPdfReaderProps = {
  source: { uri: string; headers?: Record<string, string> };
  onLoadComplete: (pages: number) => void;
  onError: (error: string) => void;
};

type NativePdfProps = {
  source: { uri: string; headers?: Record<string, string>; cache: boolean };
  style: StyleProp<ViewStyle>;
  horizontal: boolean;
  enablePaging: boolean;
  enableDoubleTapZoom: boolean;
  minScale: number;
  maxScale: number;
  spacing: number;
  trustAllCerts: boolean;
  onLoadComplete: (pages: number) => void;
  onError: (error: unknown) => void;
  renderActivityIndicator: () => ReactNode;
};

function ExpoGoProtectedPdf({ source, onLoadComplete, onError }: ProtectedPdfReaderProps) {
  const viewerUri = source.uri.replace(/\/content(\?ticket=)/, '/view$1');
  const viewerOrigin = new URL(viewerUri).origin;
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; pages?: number; message?: string };
      if (message.type === 'loaded' && message.pages) onLoadComplete(message.pages);
      if (message.type === 'error') onError(message.message ?? 'The protected PDF could not be rendered.');
    } catch {
      onError('The protected PDF viewer returned an invalid response.');
    }
  };

  return <WebView
    source={{ uri: viewerUri }}
    style={styles.webView}
    originWhitelist={[`${viewerOrigin}/*`]}
    javaScriptEnabled
    domStorageEnabled={false}
    cacheEnabled
    thirdPartyCookiesEnabled={false}
    sharedCookiesEnabled={false}
    allowFileAccess={false}
    allowFileAccessFromFileURLs={false}
    allowUniversalAccessFromFileURLs={false}
    setBuiltInZoomControls
    setDisplayZoomControls={false}
    nestedScrollEnabled
    overScrollMode="never"
    onMessage={handleMessage}
    onShouldStartLoadWithRequest={(request) => request.url.startsWith(viewerOrigin)}
    onHttpError={(event) => onError(`The protected PDF viewer returned HTTP ${event.nativeEvent.statusCode}. Please reopen the note.`)}
    onError={() => onError('The protected PDF viewer could not connect. Please reopen the note and try again.')}
  />;
}

export function ProtectedPdfReader({ source, onLoadComplete, onError }: ProtectedPdfReaderProps) {
  const [PdfComponent, setPdfComponent] = useState<ComponentType<NativePdfProps> | null>(null);

  useEffect(() => {
    if (runningInExpoGo) return;
    let mounted = true;
    void import('react-native-pdf')
      .then((module) => { if (mounted) setPdfComponent(() => module.default as unknown as ComponentType<NativePdfProps>); })
      .catch(() => onError('The PDF renderer could not start. Reopen the note and try again.'));
    return () => { mounted = false; };
  }, [onError]);

  if (runningInExpoGo) return <ExpoGoProtectedPdf source={source} onLoadComplete={onLoadComplete} onError={onError} />;
  if (!PdfComponent) return <View style={styles.loader}><ActivityIndicator color="#7C9CFF" /><Text style={styles.loaderText}>Opening protected PDF…</Text></View>;

  return <PdfComponent
    source={{ ...source, cache: false }}
    style={styles.pdf}
    horizontal={false}
    enablePaging={false}
    enableDoubleTapZoom
    minScale={1}
    maxScale={4}
    spacing={10}
    trustAllCerts={false}
    onLoadComplete={onLoadComplete}
    onError={() => onError('The protected PDF could not be opened. Reopen the note and try again.')}
    renderActivityIndicator={() => <View style={styles.loader}><ActivityIndicator color="#7C9CFF" /><Text style={styles.loaderText}>Opening protected PDF…</Text></View>}
  />;
}

const styles = StyleSheet.create({
  pdf: { flex: 1, width: '100%', backgroundColor: '#090B0D' },
  webView: { flex: 1, width: '100%', backgroundColor: '#090B0D' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#090B0D' },
  loaderText: { maxWidth: 300, color: '#A2A9B2', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
