const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect native-only modules to web stubs
  if (platform === 'web') {
    const webStubs = {
      'react-native-maps': path.resolve(__dirname, 'src/stubs/react-native-maps.js'),
      'react-native-screens': path.resolve(__dirname, 'src/stubs/react-native-screens.js'),
    };
    if (webStubs[moduleName]) {
      return { filePath: webStubs[moduleName], type: 'sourceFile' };
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
