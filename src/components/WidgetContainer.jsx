import { Component, Suspense } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
 * Sortable container component for each widget
 * Provides drag-and-drop functionality, error boundary, and loading states
 * Includes header with widget name, drag handle, and focus button
 */
export default function SortableWidgetContainer({ widget, children, isFocusMode, onFocus }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: widget.id,
    disabled: isFocusMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: widget.cols > 1 ? `span ${widget.cols}` : undefined,
    gridRow: widget.rows > 1 ? `span ${widget.rows}` : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget-container ${isDragging ? 'dragging' : ''} ${isFocusMode ? 'focused' : ''}`}
      data-widget-id={widget.id}
    >
      {!isFocusMode && (
        <div className="widget-header" {...attributes} {...listeners}>
          <div className="widget-header-drag-handle" title="Drag to reorder">
            ⠿
          </div>
          <div className="widget-header-title">{widget.name}</div>
          <button
            className="widget-focus-button"
            onClick={(e) => {
              e.stopPropagation();
              onFocus(widget.id);
            }}
            title="Expand widget"
          >
            ⤢
          </button>
        </div>
      )}
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
