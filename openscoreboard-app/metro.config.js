const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@react-stately/collections': path.resolve(
    __dirname,
    'node_modules/native-base/node_modules/@react-stately/collections'
  ),
};

module.exports = config;
