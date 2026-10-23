import { requireNativeViewManager, requireOptionalNativeModule } from 'expo-modules-core';
import type { ComponentType } from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

type LoadEvent = { pages: number };
type ErrorEvent = { message: string };

type NativeProps = ViewProps & {
  uri: string;
  headers?: Record<string, string>;
  onLoad?: (event: NativeSyntheticEvent<LoadEvent>) => void;
  onError?: (event: NativeSyntheticEvent<ErrorEvent>) => void;
};

type JetpackPdfModule = {
  isSupported: boolean;
};

const nativeModule = requireOptionalNativeModule<JetpackPdfModule>('ExpoJetpackPdfViewer');
const NativeView = nativeModule
  ? requireNativeViewManager<NativeProps>('ExpoJetpackPdfViewer')
  : null;

export const isJetpackPdfViewerAvailable = nativeModule?.isSupported === true && NativeView !== null;

export function ExpoJetpackPdfViewer(props: NativeProps) {
  if (!NativeView) return null;
  const Viewer = NativeView as ComponentType<NativeProps>;
  return <Viewer {...props} />;
}
