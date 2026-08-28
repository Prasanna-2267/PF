type ProtectedFileReaderProps = { source: { uri: string }; onLoadComplete: () => void; onError: (error: string) => void };

export function ProtectedFileReader({ source, onLoadComplete, onError }: ProtectedFileReaderProps) {
  const viewerUri = source.uri.replace(/\/content(\?ticket=)/, '/file-view$1');
  return <iframe title="Protected file" src={viewerUri} onLoad={onLoadComplete} onError={() => onError('The protected file viewer could not connect.')} style={{ width: '100%', height: '100%', border: 0, background: '#090B0D' }} />;
}
