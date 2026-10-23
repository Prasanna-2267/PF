const { WarningAggregator, withAppBuildGradle } = require('expo/config-plugins');

const beginMarker = '// @generated begin jetpack-pdf-sdk-extension';
const endMarker = '// @generated end jetpack-pdf-sdk-extension';
const sdkExtensionConfig = `${beginMarker}
    compileSdkExtension 19
    ${endMarker}`;
const minSdkBeginMarker = '// @generated begin jetpack-pdf-min-sdk';
const minSdkEndMarker = '// @generated end jetpack-pdf-min-sdk';
const minSdkConfig = `${minSdkBeginMarker}
        minSdkVersion 28
        ${minSdkEndMarker}`;

module.exports = function withJetpackPdfViewer(config) {
  return withAppBuildGradle(config, (buildGradleConfig) => {
    if (buildGradleConfig.modResults.language !== 'groovy') {
      WarningAggregator.addWarningAndroid(
        'with-jetpack-pdf-viewer',
        'Cannot configure the Jetpack PDF SDK extension because app/build.gradle is not Groovy.',
      );
      return buildGradleConfig;
    }

    const source = buildGradleConfig.modResults.contents;
    if (source.includes(beginMarker) && source.includes(minSdkBeginMarker)) return buildGradleConfig;

    const compileSdkLine = /^(\s*)compileSdk(?:Version)?\s+[^\r\n]+$/m;
    if (!compileSdkLine.test(source)) {
      WarningAggregator.addWarningAndroid(
        'with-jetpack-pdf-viewer',
        'Could not find compileSdk in app/build.gradle.',
      );
      return buildGradleConfig;
    }

    const minSdkLine = /^(\s*)minSdkVersion\s+[^\r\n]+$/m;
    if (!minSdkLine.test(source)) {
      WarningAggregator.addWarningAndroid(
        'with-jetpack-pdf-viewer',
        'Could not find minSdkVersion in app/build.gradle.',
      );
      return buildGradleConfig;
    }

    const withCompileExtension = source.replace(
      compileSdkLine,
      (match, indentation) => `${match}\n${indentation}${sdkExtensionConfig}`,
    );
    buildGradleConfig.modResults.contents = withCompileExtension.replace(
      minSdkLine,
      (match, indentation) => `${match}\n${indentation}${minSdkConfig}`,
    );
    return buildGradleConfig;
  });
};
