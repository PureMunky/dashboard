import { useState, useRef } from 'react';
import { exportWidgetConfig, importWidgetConfig } from '../utils/widgetLoader';
import './ConfigManager.css';

/**
 * Configuration Manager Component
 * Allows users to export, import, and edit widget configuration
 */
export default function ConfigManager({ widgets, gridColumns = 3, onConfigUpdate, onReset }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleOpen = () => {
    setIsOpen(true);
    setEditMode(false);
    setError(null);
    setSuccess(null);
    setJsonText(JSON.stringify({ gridColumns, widgets }, null, 2));
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleExport = () => {
    try {
      exportWidgetConfig(widgets, gridColumns);
      setSuccess('Configuration exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = importWidgetConfig(e.target.result);
        onConfigUpdate(config.widgets, config.gridColumns);
        setSuccess(`Successfully imported ${config.widgets.length} widget(s)!`);
        setTimeout(() => setSuccess(null), 3000);
        setJsonText(JSON.stringify({ gridColumns: config.gridColumns, widgets: config.widgets }, null, 2));
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportText = () => {
    try {
      const config = importWidgetConfig(jsonText);
      onConfigUpdate(config.widgets, config.gridColumns);
      setSuccess(`Successfully imported ${config.widgets.length} widget(s)!`);
      setTimeout(() => setSuccess(null), 3000);
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to default configuration? This will clear your localStorage settings.')) {
      onReset();
      setSuccess('Configuration reset to default!');
      setTimeout(() => {
        setSuccess(null);
        handleClose();
      }, 2000);
    }
  };

  const handleSaveEdit = () => {
    try {
      const config = importWidgetConfig(jsonText);
      onConfigUpdate(config.widgets, config.gridColumns);
      setSuccess('Configuration updated!');
      setTimeout(() => setSuccess(null), 3000);
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) {
    return (
      <button className="config-button" onClick={handleOpen} title="Manage widget configuration">
        ⚙️ Configure
      </button>
    );
  }

  return (
    <div className="config-modal-overlay" onClick={handleClose}>
      <div className="config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <h2>Widget Configuration</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        <div className="config-content">
          {error && (
            <div className="config-message error">
              {error}
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {success && (
            <div className="config-message success">
              {success}
            </div>
          )}

          <div className="config-actions">
            <button onClick={handleExport} className="action-button export">
              📥 Export Configuration
            </button>

            <label className="action-button import">
              📤 Import from File
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`action-button edit ${editMode ? 'active' : ''}`}
            >
              ✏️ {editMode ? 'View Mode' : 'Edit Mode'}
            </button>

            <button onClick={handleReset} className="action-button reset">
              🔄 Reset to Default
            </button>
          </div>

          <div className="config-editor">
            <div className="editor-header">
              <h3>Current Configuration</h3>
              <span className="widget-count">{widgets.length} widget(s)</span>
            </div>

            {editMode ? (
              <div className="editor-edit-mode">
                <textarea
                  className="json-editor"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  spellCheck={false}
                />
                <div className="editor-buttons">
                  <button onClick={handleSaveEdit} className="save-button">
                    💾 Save Changes
                  </button>
                  <button onClick={() => {
                    setJsonText(JSON.stringify({ gridColumns, widgets }, null, 2));
                    setEditMode(false);
                  }} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <pre className="json-preview">{jsonText}</pre>
            )}
          </div>

          <div className="config-info">
            <h4>How it works:</h4>
            <ul>
              <li><strong>Export:</strong> Download your current configuration as a JSON file</li>
              <li><strong>Import:</strong> Load a configuration from a JSON file</li>
              <li><strong>Edit:</strong> Manually edit the JSON configuration</li>
              <li><strong>Reset:</strong> Clear localStorage and reload the default widgets.json</li>
            </ul>
            <p className="config-note">
              💡 Configuration is saved to localStorage and persists across sessions.
              The default <code>widgets.json</code> is only loaded when localStorage is empty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
