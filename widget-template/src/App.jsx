import Widget from './Widget';
import './App.css';

/**
 * Standalone app wrapper for development
 * This allows the widget to run independently for testing
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Widget Standalone Mode</h1>
        <p>This is how your widget looks in development mode</p>
      </header>

      <main className="app-main">
        <div className="widget-preview">
          <Widget message="Hello from standalone mode!" />
        </div>
      </main>

      <footer className="app-footer">
        <p>Run <code>npm run dev</code> to develop this widget</p>
      </footer>
    </div>
  );
}

export default App;
