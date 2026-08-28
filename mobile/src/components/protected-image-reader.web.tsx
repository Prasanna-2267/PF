import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

type ProtectedImageReaderProps = {
  source: { uri: string; headers?: Record<string, string> };
  onLoadComplete: () => void;
  onError: (error: string) => void;
};

export function ProtectedImageReader({ source, onLoadComplete, onError }: ProtectedImageReaderProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const authorization = source.headers?.Authorization;

  useEffect(() => {
    let active = true;
    let nextUrl: string | null = null;
    void api.get<Blob>(source.uri, { headers: authorization ? { Authorization: authorization } : undefined, responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        nextUrl = URL.createObjectURL(response.data);
        setObjectUrl(nextUrl);
      })
      .catch((error: unknown) => { if (active) onError(error instanceof Error ? error.message : 'The protected image could not be opened.'); });
    return () => {
      active = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [authorization, onError, source.uri]);

  return <div style={styles.viewer} data-protected-image="true">
    {objectUrl ? <img src={objectUrl} alt="Protected study note" draggable={false} onLoad={onLoadComplete} onError={() => onError('The protected image could not be displayed.')} style={styles.image} /> : <div style={styles.status}>Opening protected image…</div>}
  </div>;
}

const styles: Record<string, React.CSSProperties> = {
  viewer: { display: 'flex', flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 12, background: '#090B0D', touchAction: 'pan-x pan-y pinch-zoom' },
  image: { display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' },
  status: { color: '#A2A9B2', fontFamily: 'Manrope, sans-serif', fontSize: 12 },
};
