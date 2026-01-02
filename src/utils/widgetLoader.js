/**
 * Dynamic widget loader for Module Federation
 * Loads remote widgets at runtime from configured URLs
 */

const loadedWidgets = new Map();

/**
 * Generate a random ID for a widget
 * @returns {string} Random ID in format 'widget-xxxxx'
 */
function generateWidgetId() {
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `widget-${randomStr}`;
}

/**
 * Normalize widget configuration with sensible defaults
 * @param {Object} widget - Raw widget configuration
 * @returns {Object} Normalized widget configuration
 */
function normalizeWidgetConfig(widget) {
  // Generate ID from name if not provided
  let id = widget.id;
  if (!id) {
    if (widget.name) {
      // Create kebab-case from name and add random suffix for uniqueness
      const kebab = widget.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const suffix = Math.random().toString(36).substring(2, 6);
      id = `${kebab}-${suffix}`;
    } else {
      id = generateWidgetId();
    }
  }

  return {
    ...widget,
    id,
    module: widget.module || './Widget', // Default to './Widget'
    props: widget.props || {}, // Default to empty object
    cols: widget.cols || 1, // Default to 1 column span
    rows: widget.rows || 1, // Default to 1 row span
    // scope is optional and not used in loading, so we keep it if provided
  };
}

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

  // Structure expected by remoteEntry.init():
  // The init function will organize these by scope
  return {
    react: {
      '19.2.0': {
        get: async () => () => reactModule,
        loaded: true,
        from: 'dashboard',
        eager: true,
        scope: 'default'
      }
    },
    'react-dom': {
      '19.2.0': {
        get: async () => () => reactDomModule,
        loaded: true,
        from: 'dashboard',
        eager: true,
        scope: 'default'
      }
    }
  };
}

/**
 * Load a remote widget component using Module Federation
 * @param {Object} widgetConfig - Normalized widget configuration
 * @param {string} widgetConfig.id - Unique widget identifier (auto-generated if not provided)
 * @param {string} widgetConfig.name - Display name for the widget
 * @param {string} widgetConfig.url - Base URL of the remote widget (required)
 * @param {string} [widgetConfig.module='./Widget'] - Module path to import
 * @param {Object} [widgetConfig.props={}] - Props to pass to the widget component
 * @param {string} [widgetConfig.scope] - Module Federation scope name (optional, not used)
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
 *
 * Optional fields with defaults:
 * - id: Auto-generated from name (kebab-case) + random suffix if not provided
 * - module: Defaults to './Widget' if not provided
 * - props: Defaults to {} if not provided
 * - cols: Defaults to 1 (number of columns widget spans)
 * - rows: Defaults to 1 (number of rows widget spans)
 * - scope: Optional, not used in loading (Module Federation handles this automatically)
 *
 * Global configuration:
 * - gridColumns: Number of columns in the dashboard grid (defaults to 3)
 *
 * @returns {Promise<Object>} Configuration object with { gridColumns, widgets }
 */
export async function loadWidgetConfig() {
  let config = null;

  // Try localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      config = JSON.parse(stored);
      console.log('Loaded widget config from localStorage');
    } catch (error) {
      console.error('Failed to parse localStorage config:', error);
      // Fall through to load from file
    }
  }

  // Fallback to widgets.json file if localStorage didn't have config
  if (!config) {
    try {
      const response = await fetch('/dashboard/widgets.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      config = await response.json();
      console.log('Loaded widget config from widgets.json');
    } catch (error) {
      console.error('Failed to load widget configuration:', error);
      return { gridColumns: 3, widgets: [] };
    }
  }

  // Normalize all widgets with defaults
  const widgets = (config.widgets || []).map(normalizeWidgetConfig);
  const gridColumns = config.gridColumns || 3;

  return { gridColumns, widgets };
}

/**
 * Save widget configuration to localStorage
 * @param {Array} widgets - Array of widget configurations
 * @param {number} gridColumns - Number of columns in the grid
 */
export function saveWidgetConfig(widgets, gridColumns = 3) {
  try {
    const config = { gridColumns, widgets };
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
 * @param {number} gridColumns - Number of columns in the grid
 */
export function exportWidgetConfig(widgets, gridColumns = 3) {
  const config = { gridColumns, widgets };
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
 * @returns {Object} Configuration object with { gridColumns, widgets }
 */
export function importWidgetConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString);
    if (!config.widgets || !Array.isArray(config.widgets)) {
      throw new Error('Invalid config format: missing "widgets" array');
    }
    return {
      gridColumns: config.gridColumns || 3,
      widgets: config.widgets
    };
  } catch (error) {
    console.error('Failed to import widget config:', error);
    throw new Error(`Import failed: ${error.message}`);
  }
}

/**
 * Reset to default configuration (clear localStorage and reload from file)
 * @returns {Promise<Object>} Configuration object with { gridColumns, widgets }
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
    return {
      gridColumns: config.gridColumns || 3,
      widgets: config.widgets || []
    };
  } catch (error) {
    console.error('Failed to load default widget configuration:', error);
    return { gridColumns: 3, widgets: [] };
  }
}

/**
 * Clear the widget cache (useful for development/hot reload)
 */
export function clearWidgetCache() {
  loadedWidgets.clear();
}
