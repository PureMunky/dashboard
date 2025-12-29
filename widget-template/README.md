# Widget Template

Template for creating dashboard widgets that can be dynamically loaded via Module Federation.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (standalone mode)
npm run dev

# Build for production
npm run build
```

## Creating Your Widget

### 1. Copy This Template

Copy this entire `widget-template/` directory to a new Git repository:

```bash
# Create new repository on GitHub first, then:
cp -r widget-template/ ../my-widget/
cd ../my-widget/
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/my-widget.git
git push -u origin main
```

### 2. Update Configuration

#### Update `package.json`

```json
{
  "name": "my-widget",
  "version": "1.0.0",
  ...
}
```

#### Update `vite.config.js`

Change the Module Federation name and base path:

```js
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'myWidget',  // Change this - must be unique and camelCase
      filename: 'remoteEntry.js',
      exposes: {
        './Widget': './src/Widget.jsx'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true }
      }
    })
  ],
  base: '/my-widget/'  // Change this to match your repository name
})
```

### 3. Develop Your Widget

Edit `src/Widget.jsx` to create your widget:

```jsx
import { useState } from 'react';
import './Widget.css';

export default function Widget(props) {
  // Your widget logic here

  return (
    <div className="my-widget">
      <h3>My Awesome Widget</h3>
      <p>Widget content goes here</p>
    </div>
  );
}
```

#### Widget Props

Your widget can receive props from the dashboard configuration:

```jsx
export default function Widget({ city, apiKey, showDetails }) {
  // Use props passed from dashboard
  return <div>City: {city}</div>;
}
```

These props are configured in the dashboard's `widgets.json`:

```json
{
  "id": "my-widget",
  "name": "My Widget",
  "url": "https://username.github.io/my-widget",
  "scope": "myWidget",
  "module": "./Widget",
  "props": {
    "city": "San Francisco",
    "apiKey": "abc123",
    "showDetails": true
  }
}
```

### 4. Test Locally

Run the development server to test your widget in standalone mode:

```bash
npm run dev
```

Visit `http://localhost:5173` to see your widget.

The `src/App.jsx` file creates a wrapper for standalone development. This is only for testing - the dashboard will load `src/Widget.jsx` directly.

### 5. Deploy to GitHub Pages

#### Enable GitHub Pages

1. Go to your repository Settings > Pages
2. Under "Build and deployment":
   - Source: **GitHub Actions**

#### Automatic Deployment

This template includes `.github/workflows/deploy.yml` which automatically deploys to GitHub Pages when you push to `main`.

```bash
git add .
git commit -m "Update widget"
git push
```

Your widget will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### 6. Add to Dashboard

Add your widget to the dashboard's `public/widgets.json`:

```json
{
  "widgets": [
    {
      "id": "my-widget",
      "name": "My Awesome Widget",
      "url": "https://YOUR_USERNAME.github.io/my-widget",
      "scope": "myWidget",
      "module": "./Widget",
      "props": {}
    }
  ]
}
```

**Important**: The `scope` field must match the `name` in your widget's `vite.config.js`.

## Widget Development Best Practices

### Keep Widgets Self-Contained

- Include all dependencies in `package.json`
- Don't rely on global state from the dashboard
- Handle your own loading and error states

### Styling

- Use scoped CSS classes (prefix with widget name)
- Avoid global styles that might conflict with dashboard or other widgets
- Consider using CSS modules or styled-components for better isolation

```css
/* Good - scoped */
.my-widget { }
.my-widget-button { }

/* Bad - global */
.button { }
h3 { }
```

### Error Handling

The dashboard provides error boundaries, but also handle errors within your widget:

```jsx
export default function Widget(props) {
  const [error, setError] = useState(null);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Widget logic...
}
```

### Performance

- Lazy load heavy dependencies
- Debounce API calls
- Clean up subscriptions/timers in useEffect cleanup

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

## Project Structure

```
widget-template/
├── .github/workflows/
│   └── deploy.yml              # Auto-deploy to GitHub Pages
├── public/                     # Static assets
├── src/
│   ├── Widget.jsx              # Your widget component (exported)
│   ├── Widget.css              # Widget styles
│   ├── App.jsx                 # Standalone wrapper for development
│   ├── App.css                 # Standalone app styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.js              # Vite + Module Federation config
└── package.json
```

## Troubleshooting

### Widget doesn't load in dashboard

1. Check browser console for errors
2. Verify your widget URL is accessible (visit it directly)
3. Ensure `scope` in dashboard config matches `name` in widget's `vite.config.js`
4. Check that `base` path in `vite.config.js` matches your repo name

### React version conflicts

Both dashboard and widget must use compatible React versions. Check `package.json`:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

### Assets not loading after deployment

Ensure `base` path in `vite.config.js` is correct:

```js
base: '/my-widget/'  // Must match GitHub repo name
```

### CORS errors

GitHub Pages should handle CORS automatically. If you see CORS errors:
- Verify the widget is actually deployed to GitHub Pages
- Check the URL is correct (case-sensitive)
- Try clearing browser cache

## Advanced Features

### Widget Communication

Widgets can communicate via custom events:

```jsx
// Emit event
window.dispatchEvent(new CustomEvent('widget-event', {
  detail: { message: 'Hello' }
}));

// Listen for events
useEffect(() => {
  const handler = (e) => console.log(e.detail);
  window.addEventListener('widget-event', handler);
  return () => window.removeEventListener('widget-event', handler);
}, []);
```

### Using External APIs

```jsx
import { useState, useEffect } from 'react';

export default function Widget({ apiKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.example.com/data?key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [apiKey]);

  if (loading) return <div>Loading...</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

### Local Storage

Store widget state persistently:

```jsx
const [count, setCount] = useState(() => {
  const saved = localStorage.getItem('myWidget:count');
  return saved ? parseInt(saved) : 0;
});

useEffect(() => {
  localStorage.setItem('myWidget:count', count);
}, [count]);
```

## Resources

- [Module Federation Docs](https://module-federation.io/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vite.dev/)
- [Main Dashboard README](../README.md)
