const { WarningAggregator, withAppBuildGradle } = require('expo/config-plugins');

const beginMarker = '// @generated begin react-native-pdf-packaging-options';
const endMarker = '// @generated end react-native-pdf-packaging-options';

const packagingOptions = `${beginMarker}
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libjsc.so'
        pickFirst 'lib/arm64-v8a/libjsc.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    }
    ${endMarker}`;

module.exports = function withReactNativePdf(config) {
  return withAppBuildGradle(config, (buildGradleConfig) => {
    if (buildGradleConfig.modResults.language !== 'groovy') {
      WarningAggregator.addWarningAndroid(
        'with-react-native-pdf',
        'Cannot automatically configure react-native-pdf because app/build.gradle is not Groovy.',
      );
      return buildGradleConfig;
    }

    const source = buildGradleConfig.modResults.contents;
    if (source.includes(beginMarker)) return buildGradleConfig;

    const androidBlock = /android(?:\s+)?\{/;
    if (!androidBlock.test(source)) {
      WarningAggregator.addWarningAndroid(
        'with-react-native-pdf',
        'Could not find the Android block in app/build.gradle.',
      );
      return buildGradleConfig;
    }

    buildGradleConfig.modResults.contents = source.replace(
      androidBlock,
      (match) => `${match}\n    ${packagingOptions}`,
    );
    return buildGradleConfig;
  });
};
