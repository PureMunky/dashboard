import { Component, Suspense } from 'react';

/**
 * Error Boundary to catch errors in widget components
 */
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="widget-error">
          <h3>Widget Error</h3>
          <p>{this.props.widgetName} failed to render</p>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading fallback component
 */
function WidgetLoading() {
  return (
    <div className="widget-loading">
      <div className="spinner"></div>
      <p>Loading widget...</p>
    </div>
  );
}

/**
 * Container component for each widget
 * Provides error boundary, loading states, and consistent styling
 */
export default function WidgetContainer({ widget, children }) {
  return (
    <div className="widget-container" data-widget-id={widget.id}>
      <div className="widget-header">
        <h2 className="widget-title">{widget.name}</h2>
      </div>
      <div className="widget-content">
        <WidgetErrorBoundary widgetName={widget.name}>
          <Suspense fallback={<WidgetLoading />}>
            {children}
          </Suspense>
        </WidgetErrorBoundary>
      </div>
    </div>
  );
}
