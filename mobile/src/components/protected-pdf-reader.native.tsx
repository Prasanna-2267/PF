import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';

const sampleFivePagePdf = require('../../assets/sample-notes/study-preview.pdf');

type ProtectedPdfReaderProps = {
  onLoadComplete: (pages: number) => void;
  onError: (error: string) => void;
};

export function ProtectedPdfReader({ onLoadComplete, onError }: ProtectedPdfReaderProps) {
  return <Pdf
    source={sampleFivePagePdf}
    style={styles.pdf}
    horizontal={false}
    enablePaging={false}
    enableDoubleTapZoom
    minScale={1}
    maxScale={4}
    spacing={10}
    trustAllCerts={false}
    onLoadComplete={(pages) => onLoadComplete(pages)}
    onError={(error) => onError(String(error))}
    renderActivityIndicator={() => <View style={styles.loader}><ActivityIndicator color="#D8BC86" /><Text style={styles.loaderText}>Opening protected PDF…</Text></View>}
  />;
}

const styles = StyleSheet.create({
  pdf: { flex: 1, width: '100%', backgroundColor: '#0A0F20' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0A0F20' },
  loaderText: { color: '#C7D0EE', fontSize: 12 },
});
