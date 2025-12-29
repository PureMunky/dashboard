/**
 * Dynamic widget loader for Module Federation
 * Loads remote widgets at runtime from configured URLs
 */

const loadedWidgets = new Map();

// Initialize the shared scope for Module Federation
// This is needed when dynamically loading remotes
async function getSharedScope() {
  // Check if __federation_shared__ exists globally (from build)
  if (typeof __federation_shared__ !== 'undefined') {
    return __federation_shared__;
  }

  // Otherwise, create it from our dependencies
  // The get function should return a factory that returns the module
  const reactModule = await import('react');
  const reactDomModule = await import('react-dom');

  return {
    default: {
      react: {
        '19.2.0': {
          get: async () => () => reactModule,
          loaded: true,
          from: 'dashboard',
          eager: true
        }
      },
      'react-dom': {
        '19.2.0': {
          get: async () => () => reactDomModule,
          loaded: true,
          from: 'dashboard',
          eager: true
        }
      }
    }
  };
}

/**
 * Load a remote widget component using Module Federation
 * @param {Object} widgetConfig - Widget configuration from widgets.json
 * @param {string} widgetConfig.id - Unique widget identifier
 * @param {string} widgetConfig.url - Base URL of the remote widget
 * @param {string} widgetConfig.scope - Module Federation scope name
 * @param {string} widgetConfig.module - Module path to import (e.g., './Widget')
 * @returns {Promise<React.Component>} The loaded widget component
 */
export async function loadWidget(widgetConfig) {
  const { id, url, scope, module } = widgetConfig;

  // Return cached widget if already loaded
  if (loadedWidgets.has(id)) {
    return loadedWidgets.get(id);
  }

  try {
    // Construct the remoteEntry.js URL
    const remoteEntryUrl = `${url}/assets/remoteEntry.js`;

    // Dynamically import the remote entry
    // @vite-ignore tells Vite to skip analyzing this import
    const container = await import(/* @vite-ignore */ remoteEntryUrl);

    // Initialize the remote container with shared scope
    // This ensures React is shared between dashboard and widgets
    const sharedScope = await getSharedScope();
    await container.init(sharedScope);

    // Get the exposed module from the remote container
    const factory = await container.get(module);
    const Module = factory();

    // Cache the loaded widget
    loadedWidgets.set(id, Module.default || Module);

    return Module.default || Module;
  } catch (error) {
    console.error(`Failed to load widget "${id}" from ${url}:`, error);
    throw new Error(`Widget "${id}" failed to load: ${error.message}`);
  }
}

const STORAGE_KEY = 'dashboard-widgets-config';

/**
 * Load widget configuration from localStorage or fallback to public/widgets.json
 * Priority: localStorage > widgets.json
 * @returns {Promise<Array>} Array of widget configurations
 */
export async function loadWidgetConfig() {
  // Try localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const config = JSON.parse(stored);
      console.log('Loaded widget config from localStorage');
      return config.widgets || [];
    } catch (error) {
      console.error('Failed to parse localStorage config:', error);
      // Fall through to load from file
    }
  }

  // Fallback to widgets.json file
  try {
    const response = await fetch('/dashboard/widgets.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    console.log('Loaded widget config from widgets.json');
    return config.widgets || [];
  } catch (error) {
    console.error('Failed to load widget configuration:', error);
    return [];
  }
}

/**
 * Save widget configuration to localStorage
 * @param {Array} widgets - Array of widget configurations
 */
export function saveWidgetConfig(widgets) {
  try {
    const config = { widgets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config, null, 2));
    console.log('Saved widget config to localStorage');
  } catch (error) {
    console.error('Failed to save widget config:', error);
    throw error;
  }
}

/**
 * Export widget configuration as JSON file
 * @param {Array} widgets - Array of widget configurations
 */
export function exportWidgetConfig(widgets) {
  const config = { widgets };
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-widgets-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import widget configuration from JSON
 * @param {string} jsonString - JSON string containing widget configuration
 * @returns {Array} Array of widget configurations
 */
export function importWidgetConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString);
    if (!config.widgets || !Array.isArray(config.widgets)) {
      throw new Error('Invalid config format: missing "widgets" array');
    }
    return config.widgets;
  } catch (error) {
    console.error('Failed to import widget config:', error);
    throw new Error(`Import failed: ${error.message}`);
  }
}

/**
 * Reset to default configuration (clear localStorage and reload from file)
 * @returns {Promise<Array>} Array of widget configurations from file
 */
export async function resetWidgetConfig() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Reset widget config to default');

  // Load from file
  try {
    const response = await fetch('/dashboard/widgets.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    return config.widgets || [];
  } catch (error) {
    console.error('Failed to load default widget configuration:', error);
    return [];
  }
}

/**
 * Clear the widget cache (useful for development/hot reload)
 */
export function clearWidgetCache() {
  loadedWidgets.clear();
}
