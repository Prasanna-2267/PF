const { WarningAggregator, withMainActivity } = require('expo/config-plugins');

const beginMarker = '// @generated begin parallax-flow-secure-window';
const endMarker = '// @generated end parallax-flow-secure-window';

module.exports = function withAndroidSecureByDefault(config) {
  return withMainActivity(config, (mainActivityConfig) => {
    const { language } = mainActivityConfig.modResults;
    let source = mainActivityConfig.modResults.contents;

    if (source.includes(beginMarker)) return mainActivityConfig;

    if (language === 'kt') {
      if (!source.includes('import android.view.WindowManager')) {
        source = source.replace(
          /^(package\s+[^\r\n]+\r?\n)/m,
          '$1\nimport android.view.WindowManager\n',
        );
      }

      const superCall = /super\.onCreate\((?:null|savedInstanceState)\)/;
      if (!superCall.test(source)) {
        WarningAggregator.addWarningAndroid(
          'with-android-secure-by-default',
          'Could not find MainActivity.onCreate in the Kotlin source.',
        );
        return mainActivityConfig;
      }

      source = source.replace(
        superCall,
        (match) => `${match}\n    ${beginMarker}\n    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)\n    ${endMarker}`,
      );
    } else if (language === 'java') {
      if (!source.includes('import android.view.WindowManager;')) {
        source = source.replace(
          /^(package\s+[^;]+;\r?\n)/m,
          '$1\nimport android.view.WindowManager;\n',
        );
      }

      const superCall = /super\.onCreate\((?:null|savedInstanceState)\);/;
      if (!superCall.test(source)) {
        WarningAggregator.addWarningAndroid(
          'with-android-secure-by-default',
          'Could not find MainActivity.onCreate in the Java source.',
        );
        return mainActivityConfig;
      }

      source = source.replace(
        superCall,
        (match) => `${match}\n    ${beginMarker}\n    getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);\n    ${endMarker}`,
      );
    } else {
      WarningAggregator.addWarningAndroid(
        'with-android-secure-by-default',
        `Unsupported MainActivity language: ${language}`,
      );
      return mainActivityConfig;
    }

    mainActivityConfig.modResults.contents = source;
    return mainActivityConfig;
  });
};
