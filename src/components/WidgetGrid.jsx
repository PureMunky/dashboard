import { useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableWidgetContainer from './WidgetContainer';

/**
 * Responsive grid layout for widgets with drag-and-drop reordering and focus mode
 * Supports configurable grid columns and per-widget column/row spans
 */
export default function WidgetGrid({ widgets, widgetComponents, gridColumns = 3, onReorder, focusedWidgetId, onFocus, onExitFocus }) {
  const isFocusMode = focusedWidgetId !== null;

  // Configure drag sensors with activation distance to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag end event
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex(w => w.id === active.id);
      const newIndex = widgets.findIndex(w => w.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  // Handle ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFocusMode) {
        onExitFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, onExitFocus]);

  if (!widgets || widgets.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Widgets Configured</h2>
        <p>Add widgets to your <code>public/widgets.json</code> file to get started.</p>
      </div>
    );
  }

  // Filter widgets for focus mode
  const displayWidgets = isFocusMode
    ? widgets.filter(w => w.id === focusedWidgetId)
    : widgets;

  return (
    <>
      {isFocusMode && (
        <button className="exit-focus-button" onClick={onExitFocus}>
          ← Back to Dashboard
        </button>
      )}
      <DndContext
        sensors={isFocusMode ? [] : sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className={`widget-grid ${isFocusMode ? 'focus-mode' : ''}`}
            style={{ '--grid-columns': gridColumns }}
          >
            {displayWidgets.map((widget) => {
              const WidgetComponent = widgetComponents[widget.id];

              if (!WidgetComponent) {
                return (
                  <SortableWidgetContainer
                    key={widget.id}
                    widget={widget}
                    isFocusMode={isFocusMode}
                    onFocus={onFocus}
                  >
                    <div className="widget-error">
                      <p>Widget failed to load</p>
                    </div>
                  </SortableWidgetContainer>
                );
              }

              return (
                <SortableWidgetContainer
                  key={widget.id}
                  widget={widget}
                  isFocusMode={isFocusMode}
                  onFocus={onFocus}
                >
                  <WidgetComponent {...(widget.props || {})} />
                </SortableWidgetContainer>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
