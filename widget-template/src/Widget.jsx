import { useState } from 'react';
import './Widget.css';

/**
 * Example Widget Component
 * This component is exposed via Module Federation and loaded by the dashboard
 */
export default function Widget(props) {
  const [count, setCount] = useState(0);

  return (
    <div className="example-widget">
      <h3>Example Widget</h3>
      <p>This is a dynamically loaded widget from a remote repository!</p>

      <div className="widget-demo">
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
        <p className="widget-info">
          This widget demonstrates Module Federation working correctly.
        </p>
      </div>

      {props.message && (
        <div className="widget-props">
          <strong>Props received:</strong> {props.message}
        </div>
      )}
    </div>
  );
}
