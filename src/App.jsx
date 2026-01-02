import './App.css'
import { useState } from 'react'
import useWidgets from './hooks/useWidgets'
import WidgetGrid from './components/WidgetGrid'
import ConfigManager from './components/ConfigManager'

function App() {
  const { widgets, gridColumns, widgetComponents, loading, error, updateConfig, resetConfig } = useWidgets();
  const [focusedWidgetId, setFocusedWidgetId] = useState(null);

  // Array move utility function
  const arrayMove = (array, from, to) => {
    const newArray = array.slice();
    newArray.splice(to, 0, newArray.splice(from, 1)[0]);
    return newArray;
  };

  // Handle widget reordering
  const handleReorder = (oldIndex, newIndex) => {
    const newWidgets = arrayMove(widgets, oldIndex, newIndex);
    updateConfig(newWidgets);
  };

  // Handle widget focus
  const handleWidgetFocus = (widgetId) => {
    setFocusedWidgetId(widgetId);
  };

  const handleExitFocus = () => {
    setFocusedWidgetId(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Failed to Load Dashboard</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="app-main">
        <WidgetGrid
          widgets={widgets}
          widgetComponents={widgetComponents}
          gridColumns={gridColumns}
          onReorder={handleReorder}
          focusedWidgetId={focusedWidgetId}
          onFocus={handleWidgetFocus}
          onExitFocus={handleExitFocus}
        />
      </main>
      {!focusedWidgetId && (
        <ConfigManager
          widgets={widgets}
          gridColumns={gridColumns}
          onConfigUpdate={updateConfig}
          onReset={resetConfig}
        />
      )}
    </div>
  )
}

export default App
