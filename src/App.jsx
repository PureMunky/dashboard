import './App.css'
import useWidgets from './hooks/useWidgets'
import WidgetGrid from './components/WidgetGrid'
import ConfigManager from './components/ConfigManager'

function App() {
  const { widgets, widgetComponents, loading, error, updateConfig, resetConfig } = useWidgets();

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
        <WidgetGrid widgets={widgets} widgetComponents={widgetComponents} />
      </main>
      <ConfigManager
        widgets={widgets}
        onConfigUpdate={updateConfig}
        onReset={resetConfig}
      />
    </div>
  )
}

export default App
