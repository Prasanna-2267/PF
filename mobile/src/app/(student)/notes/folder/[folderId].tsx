import { useLocalSearchParams } from 'expo-router';
import { RemoteFolderScreen } from '@/components/remote-notes';

export default function FolderScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  return <RemoteFolderScreen folderId={folderId} />;
}
