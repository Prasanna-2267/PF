import { useEffect, useState } from 'react';

type ProtectedPdfReaderProps = {
  onLoadComplete: (pages: number) => void;
  onError: (error: string) => void;
};

const sampleFivePagePdf = require('../../assets/sample-notes/study-preview.pdf');
type PdfComponents = Pick<typeof import('react-pdf'), 'Document' | 'Page'>;

export function ProtectedPdfReader({ onLoadComplete, onError }: ProtectedPdfReaderProps) {
  const [pageWidth, setPageWidth] = useState(360);
  const [pdfComponents, setPdfComponents] = useState<PdfComponents | null>(null);

  useEffect(() => {
    const updateWidth = () => setPageWidth(Math.max(280, Math.min(window.innerWidth - 28, 720)));
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // PDF.js accesses DOMMatrix at import time. Loading it only after hydration
  // keeps Expo's static renderer server-safe while the browser gets canvas PDFs.
  useEffect(() => {
    let mounted = true;
    void import('react-pdf').then(({ Document, Page, pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      if (mounted) setPdfComponents({ Document, Page });
    }).catch((error: unknown) => onError(error instanceof Error ? error.message : 'The PDF renderer could not start.'));
    return () => { mounted = false; };
  }, [onError]);

  if (!pdfComponents) return <div style={styles.viewer}><div style={styles.status}>Opening protected PDF…</div></div>;
  const { Document, Page } = pdfComponents;

  return <div style={styles.viewer} data-protected-pdf="true">
    <Document
      file={sampleFivePagePdf}
      loading={<div style={styles.status}>Opening protected PDF…</div>}
      error={<div style={styles.status}>Unable to open the sample PDF.</div>}
      onLoadSuccess={({ numPages }) => onLoadComplete(numPages)}
      onLoadError={(error) => onError(error.message)}
    >
      {Array.from({ length: 5 }, (_, index) => <div key={index} style={styles.page}><Page pageNumber={index + 1} width={pageWidth} renderAnnotationLayer={false} renderTextLayer={false} /></div>)}
    </Document>
  </div>;
}

const styles: Record<string, React.CSSProperties> = {
  viewer: { flex: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', padding: '14px 0 28px', background: '#0A0F20', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' },
  page: { display: 'flex', justifyContent: 'center', marginBottom: 12, userSelect: 'none' },
  status: { minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C7D0EE', fontFamily: 'Manrope, sans-serif', fontSize: 12 },
};
