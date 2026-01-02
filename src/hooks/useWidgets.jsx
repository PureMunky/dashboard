import { useState, useEffect, useCallback } from 'react';
import {
  loadWidget,
  loadWidgetConfig,
  saveWidgetConfig,
  resetWidgetConfig
} from '../utils/widgetLoader';

/**
 * Custom hook to load and manage remote widgets
 * Loads widget configuration and dynamically imports widget components
 *
 * @returns {Object} Widget state and management
 * @returns {Array} return.widgets - Array of widget configurations
 * @returns {number} return.gridColumns - Number of columns in the grid
 * @returns {Object} return.widgetComponents - Map of widget ID to loaded component
 * @returns {boolean} return.loading - Loading state
 * @returns {Error|null} return.error - Error state
 * @returns {Function} return.updateConfig - Update widget configuration
 * @returns {Function} return.resetConfig - Reset to default configuration
 * @returns {Function} return.reloadWidgets - Reload all widgets
 */
export default function useWidgets() {
  const [widgets, setWidgets] = useState([]);
  const [gridColumns, setGridColumns] = useState(3);
  const [widgetComponents, setWidgetComponents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load widgets function (can be called on demand)
  const loadWidgets = useCallback(async (widgetConfigs) => {
    const loadedComponents = {};
    const loadPromises = widgetConfigs.map(async (widget) => {
      try {
        const component = await loadWidget(widget);
        loadedComponents[widget.id] = component;
      } catch (err) {
        console.error(`Failed to load widget ${widget.id}:`, err);
        // Continue loading other widgets even if one fails
        loadedComponents[widget.id] = null;
      }
    });

    await Promise.all(loadPromises);
    return loadedComponents;
  }, []);

  // Initialize widgets on mount and when refresh is triggered
  useEffect(() => {
    async function initWidgets() {
      try {
        setLoading(true);
        setError(null);

        // Load widget configuration (from localStorage or file)
        const config = await loadWidgetConfig();
        setWidgets(config.widgets);
        setGridColumns(config.gridColumns);

        // Load widget components
        const components = await loadWidgets(config.widgets);
        setWidgetComponents(components);
      } catch (err) {
        console.error('Failed to initialize widgets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    initWidgets();
  }, [refreshTrigger, loadWidgets]);

  // Update configuration and reload widgets
  const updateConfig = useCallback(async (newWidgets, newGridColumns) => {
    try {
      setLoading(true);
      setError(null);

      // Use current gridColumns if not provided
      const cols = newGridColumns !== undefined ? newGridColumns : gridColumns;

      // Save to localStorage
      saveWidgetConfig(newWidgets, cols);

      // Update state
      setWidgets(newWidgets);
      setGridColumns(cols);

      // Reload widget components
      const components = await loadWidgets(newWidgets);
      setWidgetComponents(components);
    } catch (err) {
      console.error('Failed to update configuration:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [loadWidgets, gridColumns]);

  // Reset to default configuration
  const resetConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Reset localStorage and load from file
      const config = await resetWidgetConfig();

      // Update state
      setWidgets(config.widgets);
      setGridColumns(config.gridColumns);

      // Reload widget components
      const components = await loadWidgets(config.widgets);
      setWidgetComponents(components);
    } catch (err) {
      console.error('Failed to reset configuration:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [loadWidgets]);

  // Reload all widgets (useful for development/testing)
  const reloadWidgets = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    widgets,
    gridColumns,
    widgetComponents,
    loading,
    error,
    updateConfig,
    resetConfig,
    reloadWidgets
  };
}
