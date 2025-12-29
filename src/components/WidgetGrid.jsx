import WidgetContainer from './WidgetContainer';

/**
 * Responsive grid layout for widgets
 * Automatically arranges widgets in a responsive grid
 */
export default function WidgetGrid({ widgets, widgetComponents }) {
  if (!widgets || widgets.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Widgets Configured</h2>
        <p>Add widgets to your <code>public/widgets.json</code> file to get started.</p>
      </div>
    );
  }

  return (
    <div className="widget-grid">
      {widgets.map((widget) => {
        const WidgetComponent = widgetComponents[widget.id];

        if (!WidgetComponent) {
          return (
            <WidgetContainer key={widget.id} widget={widget}>
              <div className="widget-error">
                <p>Widget failed to load</p>
              </div>
            </WidgetContainer>
          );
        }

        return (
          <WidgetContainer key={widget.id} widget={widget}>
            <WidgetComponent {...(widget.props || {})} />
          </WidgetContainer>
        );
      })}
    </div>
  );
}
