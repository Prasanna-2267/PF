import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Constants from 'expo-constants';

const sampleFivePagePdf = require('../../assets/sample-notes/study-preview.pdf');
const runningInExpoGo = Constants.expoGoConfig !== null;

type ProtectedPdfReaderProps = {
  onLoadComplete: (pages: number) => void;
  onError: (error: string) => void;
};

type NativePdfProps = {
  source: number;
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

const previewPages = [
  { section: 'FOUNDATIONS', title: 'Constitutional Framework', intro: 'A concise study note on the structure, principles and institutions that shape constitutional government.', points: ['Meaning and purpose of a constitution', 'Constitutionalism and limited government', 'Sources of constitutional authority'] },
  { section: 'CORE PRINCIPLES', title: 'The constitutional idea', intro: 'A constitution establishes public institutions while defining the limits within which authority may be exercised.', points: ['Rule of law', 'Separation of powers', 'Checks and balances'] },
  { section: 'INSTITUTIONS', title: 'Distribution of power', intro: 'Power is organised across institutions and levels of government to create accountability and effective administration.', points: ['Legislature and executive', 'Independent judiciary', 'Federal distribution of powers'] },
  { section: 'RIGHTS', title: 'Liberty and accountability', intro: 'Fundamental rights protect individual freedom and provide remedies when public power exceeds constitutional limits.', points: ['Equality before law', 'Freedoms and reasonable limits', 'Constitutional remedies'] },
  { section: 'QUICK REVISION', title: 'Key takeaways', intro: 'Use this final page to recall the relationships between authority, institutional design, rights and accountability.', points: ['Define constitutionalism', 'Compare separation and distribution of power', 'Connect rights with judicial review'] },
];

function ExpoGoPreview({ onLoadComplete }: Pick<ProtectedPdfReaderProps, 'onLoadComplete'>) {
  useEffect(() => onLoadComplete(previewPages.length), [onLoadComplete]);
  return <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false} minimumZoomScale={1} maximumZoomScale={3}>
    <View style={styles.previewNotice}><Text style={styles.previewNoticeText}>EXPO GO · SECURE DOCUMENT PREVIEW</Text></View>
    {previewPages.map((page, index) => <View key={page.title} style={styles.page}>
      <View style={styles.pageAccent} />
      <Text style={styles.pageBrand}>PARALLAX FLOW</Text>
      <Text style={styles.pageSection}>{page.section}</Text>
      <Text style={styles.pageTitle}>{page.title}</Text>
      <Text style={styles.pageIntro}>{page.intro}</Text>
      <View style={styles.rule} />
      <Text style={styles.pageHeading}>What to remember</Text>
      <View style={styles.points}>{page.points.map((point, pointIndex) => <View key={point} style={styles.point}><View style={styles.pointNumber}><Text style={styles.pointNumberText}>{pointIndex + 1}</Text></View><Text style={styles.pointText}>{point}</Text></View>)}</View>
      <View style={styles.callout}><Text style={styles.calloutLabel}>STUDY PROMPT</Text><Text style={styles.calloutText}>Explain this section in your own words before moving to the next page.</Text></View>
      <Text style={styles.pageNumber}>{index + 1} / {previewPages.length}</Text>
    </View>)}
  </ScrollView>;
}

export function ProtectedPdfReader({ onLoadComplete, onError }: ProtectedPdfReaderProps) {
  const [PdfComponent, setPdfComponent] = useState<ComponentType<NativePdfProps> | null>(null);

  useEffect(() => {
    if (runningInExpoGo) return;
    let mounted = true;
    void import('react-native-pdf')
      .then((module) => { if (mounted) setPdfComponent(() => module.default as unknown as ComponentType<NativePdfProps>); })
      .catch((error: unknown) => onError(error instanceof Error ? error.message : 'The native PDF renderer could not start.'));
    return () => { mounted = false; };
  }, [onError]);

  if (runningInExpoGo) return <ExpoGoPreview onLoadComplete={onLoadComplete} />;
  if (!PdfComponent) return <View style={styles.loader}><ActivityIndicator color="#7C9CFF" /><Text style={styles.loaderText}>Opening protected PDF…</Text></View>;

  return <PdfComponent
    source={sampleFivePagePdf}
    style={styles.pdf}
    horizontal={false}
    enablePaging={false}
    enableDoubleTapZoom
    minScale={1}
    maxScale={4}
    spacing={10}
    trustAllCerts={false}
    onLoadComplete={onLoadComplete}
    onError={(error) => onError(String(error))}
    renderActivityIndicator={() => <View style={styles.loader}><ActivityIndicator color="#7C9CFF" /><Text style={styles.loaderText}>Opening protected PDF…</Text></View>}
  />;
}

const styles = StyleSheet.create({
  pdf: { flex: 1, width: '100%', backgroundColor: '#090B0D' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#090B0D' },
  loaderText: { color: '#A2A9B2', fontSize: 12 },
  previewScroll: { flex: 1, backgroundColor: '#090B0D' },
  previewContent: { alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 30, gap: 12 },
  previewNotice: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: '#18213D', borderWidth: 1, borderColor: '#344B83' },
  previewNoticeText: { color: '#9FB3FF', fontSize: 8, fontWeight: '700', letterSpacing: 0.9 },
  page: { width: '100%', maxWidth: 620, minHeight: 550, paddingHorizontal: 28, paddingVertical: 30, backgroundColor: '#F8F7F2', overflow: 'hidden' },
  pageAccent: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -90, top: -90, backgroundColor: '#E7EBFA' },
  pageBrand: { color: '#3E56AA', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  pageSection: { marginTop: 52, color: '#A5772F', fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  pageTitle: { marginTop: 7, maxWidth: 330, color: '#151A1D', fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 },
  pageIntro: { marginTop: 14, color: '#535C62', fontSize: 12, lineHeight: 20 },
  rule: { height: 1, marginVertical: 22, backgroundColor: '#DFE2DF' },
  pageHeading: { color: '#1C2427', fontSize: 14, fontWeight: '700' },
  points: { marginTop: 13, gap: 12 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointNumber: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E9F8' },
  pointNumberText: { color: '#425AAE', fontSize: 10, fontWeight: '800' },
  pointText: { flex: 1, color: '#353D41', fontSize: 11, lineHeight: 17 },
  callout: { marginTop: 28, borderLeftWidth: 3, borderLeftColor: '#D0A04E', padding: 13, backgroundColor: '#F2ECE0' },
  calloutLabel: { color: '#926924', fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  calloutText: { marginTop: 5, color: '#4F4A40', fontSize: 10, lineHeight: 16 },
  pageNumber: { position: 'absolute', right: 24, bottom: 18, color: '#929996', fontSize: 9, fontWeight: '600' },
});
