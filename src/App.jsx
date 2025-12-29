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
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Micro-Frontend Dashboard</h1>
            <p className="subtitle">Dynamically loaded widgets from remote repositories</p>
          </div>
          <ConfigManager
            widgets={widgets}
            onConfigUpdate={updateConfig}
            onReset={resetConfig}
          />
        </div>
      </header>

      <main className="app-main">
        <WidgetGrid widgets={widgets} widgetComponents={widgetComponents} />
      </main>

      <footer className="app-footer">
        <p>Built with Vite + React + Module Federation</p>
      </footer>
    </div>
  )
}

export default App
