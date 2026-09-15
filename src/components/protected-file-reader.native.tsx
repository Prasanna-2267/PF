import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type ProtectedFileReaderProps = {
  source: { uri: string; headers?: Record<string, string> };
  onLoadComplete: () => void;
  onError: (error: string) => void;
};

export function ProtectedFileReader({ source, onLoadComplete, onError }: ProtectedFileReaderProps) {
  const viewerUri = source.uri.replace(/\/content(\?ticket=)/, '/file-view$1');
  const viewerOrigin = new URL(viewerUri).origin;
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; message?: string };
      if (message.type === 'loaded') onLoadComplete();
      if (message.type === 'error') onError(message.message ?? 'The protected file could not be rendered.');
    } catch {
      onError('The protected file viewer returned an invalid response.');
    }
  };

  return <WebView source={{ uri: viewerUri }} style={styles.viewer} originWhitelist={[`${viewerOrigin}/*`]} javaScriptEnabled domStorageEnabled={false} cacheEnabled={false} thirdPartyCookiesEnabled={false} sharedCookiesEnabled={false} allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} allowsFullscreenVideo={false} setBuiltInZoomControls setDisplayZoomControls={false} onMessage={handleMessage} onShouldStartLoadWithRequest={(request) => request.url.startsWith(viewerOrigin)} onHttpError={(event) => onError(`The protected file viewer returned HTTP ${event.nativeEvent.statusCode}.`)} onError={() => onError('The protected file viewer could not connect. Please reopen the file.')} />;
}

const styles = StyleSheet.create({ viewer: { flex: 1, width: '100%', backgroundColor: '#090B0D' } });
