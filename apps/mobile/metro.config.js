// Metro config para que funcione el monorepo (pnpm workspaces).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Ver node_modules del workspace raíz además de los locales.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 2. Evitar duplicar paquetes: deshabilitar hoisting sorpresivo.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
