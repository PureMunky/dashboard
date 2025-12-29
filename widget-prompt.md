# Widget Development Prompt

Use this document to create a new widget or convert an existing React project to be compatible with the Micro-Frontend Dashboard.

## Project Requirements

Create a React widget that can be dynamically loaded into a micro-frontend dashboard using Vite + Module Federation. The widget must:

1. Be a standalone Vite + React application
2. Expose a React component via Module Federation
3. Be deployable to GitHub Pages
4. Share React dependencies with the host dashboard
5. Work both standalone (for development) and as a remote module

## Technical Specifications

### Package Dependencies

Required `package.json` dependencies:

```json
{
  "name": "your-widget-name",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@originjs/vite-plugin-federation": "^1.3.6",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.6"
  }
}
```

### Vite Configuration

Create `vite.config.js` with Module Federation:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'yourWidgetName',  // Must be unique, camelCase
      filename: 'remoteEntry.js',
      exposes: {
        './Widget': './src/Widget.jsx'  // Main widget component
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        }
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  },
  base: '/your-repo-name/'  // Must match GitHub repository name
})
```

**Critical Configuration Notes:**
- `name`: Must be unique and camelCase (e.g., 'weatherWidget', 'todoList')
- `base`: Must exactly match your GitHub repository name (e.g., '/weather-widget/')
- `shared.react.singleton`: Must be `true` to prevent duplicate React instances

### Widget Component Structure

#### Main Widget Component (`src/Widget.jsx`)

This is the component that will be loaded by the dashboard:

```jsx
import { useState, useEffect } from 'react';
import './Widget.css';

/**
 * Widget Component
 * Exposed via Module Federation - loaded dynamically by dashboard
 *
 * @param {Object} props - Props passed from dashboard configuration
 */
export default function Widget(props) {
  // Your widget logic here
  // Props are configured in the dashboard's widgets.json

  return (
    <div className="your-widget-name">
      <h3>Widget Title</h3>
      <p>Widget content</p>

      {/* Example: Using props from dashboard */}
      {props.message && <p>{props.message}</p>}
    </div>
  );
}
```

**Widget Component Guidelines:**
- Export as default
- Must be self-contained (no dependencies on parent app state)
- Handle your own loading states and errors
- Accept props from dashboard configuration
- Use scoped CSS class names to avoid conflicts

#### Standalone App Wrapper (`src/App.jsx`)

For local development and testing:

```jsx
import Widget from './Widget';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Widget Standalone Mode</h1>
        <p>Development preview</p>
      </header>

      <main className="app-main">
        <div className="widget-preview">
          <Widget message="Test message" />
        </div>
      </main>
    </div>
  );
}

export default App;
```

#### Entry Point (`src/main.jsx`)

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

#### HTML Template (`index.html`)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Widget - Standalone</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Styling Best Practices

**Widget CSS (`src/Widget.css`):**
```css
/* Always use scoped class names with widget prefix */
.your-widget-name {
  font-family: system-ui, -apple-system, sans-serif;
}

.your-widget-name h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

/* Avoid global selectors like h1, p, button without scoping */
/* Bad: h3 { } */
/* Good: .your-widget-name h3 { } */
```

**Important CSS Rules:**
- ✅ Always prefix classes with your widget name
- ✅ Use scoped/namespaced selectors
- ✅ Avoid global styles
- ❌ Don't use bare element selectors (h1, p, etc.)
- ❌ Don't rely on parent app styles

### GitHub Pages Deployment

#### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy Widget to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### GitHub Pages Setup

1. Go to repository Settings → Pages
2. Source: **GitHub Actions**
3. Push to main branch triggers automatic deployment
4. Widget will be available at: `https://USERNAME.github.io/REPO_NAME/`

### Dashboard Integration

Once your widget is deployed, add it to the dashboard:

#### Dashboard Configuration

Add to the dashboard's configuration (via UI or `widgets.json`):

```json
{
  "id": "your-widget-id",
  "name": "Your Widget Display Name",
  "url": "https://YOUR_USERNAME.github.io/your-repo-name",
  "scope": "yourWidgetName",
  "module": "./Widget",
  "props": {
    "customProp1": "value1",
    "customProp2": "value2"
  }
}
```

**Configuration Fields:**
- `id`: Unique identifier (kebab-case recommended)
- `name`: Display name in dashboard
- `url`: Your GitHub Pages URL (no trailing slash)
- `scope`: Must match `name` in your `vite.config.js`
- `module`: Always `"./Widget"` (unless you expose different path)
- `props`: Optional props passed to your widget component

## Widget Development Workflow

### 1. Initialize Project

```bash
npm create vite@latest your-widget-name -- --template react
cd your-widget-name
npm install
npm install @originjs/vite-plugin-federation --save-dev
```

### 2. Configure Module Federation

- Update `vite.config.js` with federation config
- Set unique `name` (scope)
- Set correct `base` path for GitHub Pages

### 3. Create Widget Component

- Create `src/Widget.jsx` with your widget logic
- Use scoped CSS classes
- Accept props parameter
- Handle errors internally

### 4. Test Locally

```bash
npm run dev
# Visit http://localhost:5173
# Test in standalone mode
```

### 5. Build and Verify

```bash
npm run build
# Check dist/assets/remoteEntry.js exists
# Verify base path is correct in built files
```

### 6. Deploy to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 7. Enable GitHub Pages

- Settings → Pages → Source: GitHub Actions
- Wait for deployment
- Verify widget loads at `https://USERNAME.github.io/REPO_NAME/`

### 8. Add to Dashboard

- Open dashboard → Click "⚙️ Configure"
- Click "✏️ Edit Mode"
- Add your widget configuration
- Click "💾 Save Changes"
- Widget loads automatically!

## Common Issues and Solutions

### Widget doesn't load in dashboard

**Check:**
- ✅ GitHub Pages is enabled and deployed
- ✅ Widget URL is accessible (visit it directly)
- ✅ `scope` in dashboard matches `name` in `vite.config.js`
- ✅ `base` path matches repository name
- ✅ `remoteEntry.js` exists in `dist/assets/`

### React duplicate error

**Cause:** React loaded twice (dashboard + widget)

**Solution:** Ensure `singleton: true` in both dashboard and widget:
```js
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true }
}
```

### Assets not loading

**Cause:** Incorrect `base` path

**Solution:** `base` in `vite.config.js` must match repo name:
```js
base: '/exact-repo-name/'  // Note the slashes
```

### CORS errors

**Cause:** Widget not properly deployed to GitHub Pages

**Solution:**
- Verify deployment succeeded
- Check GitHub Actions logs
- Wait a few minutes for propagation
- Clear browser cache

### Styles conflicting with dashboard

**Cause:** Global CSS selectors

**Solution:** Namespace all your CSS:
```css
/* Bad */
h3 { color: red; }

/* Good */
.my-widget h3 { color: red; }
```

## Widget Ideas and Examples

### Simple Widgets
- Clock/Timer
- Weather display
- Random quote generator
- Cryptocurrency ticker
- GitHub profile stats

### Data Widgets
- Todo list (localStorage)
- Note taking
- Bookmark manager
- RSS feed reader
- Calendar view

### API Widgets
- Twitter feed
- News headlines
- Stock prices
- Sports scores
- COVID stats

### Interactive Widgets
- Calculator
- Unit converter
- Color picker
- Pomodoro timer
- Habit tracker

## Advanced Features

### Using External APIs

```jsx
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
      .catch(err => console.error(err));
  }, [apiKey]);

  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### Using localStorage

```jsx
export default function Widget() {
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('myWidget:count');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('myWidget:count', count);
  }, [count]);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Widget-to-Widget Communication

```jsx
// Emit event
const notifyOthers = () => {
  window.dispatchEvent(new CustomEvent('widget-event', {
    detail: { widgetId: 'my-widget', message: 'Hello!' }
  }));
};

// Listen for events
useEffect(() => {
  const handler = (e) => {
    console.log('Event from:', e.detail.widgetId);
  };
  window.addEventListener('widget-event', handler);
  return () => window.removeEventListener('widget-event', handler);
}, []);
```

## File Structure Summary

```
your-widget/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── public/                     # Static assets
├── src/
│   ├── Widget.jsx              # Main widget (REQUIRED - exposed via MF)
│   ├── Widget.css              # Widget styles
│   ├── App.jsx                 # Standalone wrapper
│   ├── App.css                 # Standalone styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.js              # Vite + Module Federation config (CRITICAL)
├── package.json                # Dependencies
├── .gitignore
└── README.md
```

## Checklist

Before publishing your widget:

- [ ] Module Federation configured in `vite.config.js`
- [ ] `name` field is unique and camelCase
- [ ] `base` path matches repository name exactly
- [ ] React shared as singleton
- [ ] `Widget.jsx` created and exported as default
- [ ] CSS uses scoped class names
- [ ] Widget accepts props parameter
- [ ] Tested locally with `npm run dev`
- [ ] Built successfully with `npm run build`
- [ ] `remoteEntry.js` exists in `dist/assets/`
- [ ] GitHub Actions workflow added
- [ ] GitHub Pages enabled (Source: GitHub Actions)
- [ ] Widget accessible at GitHub Pages URL
- [ ] Added to dashboard configuration
- [ ] Widget loads in dashboard without errors

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all checklist items above
3. Compare your config with the widget-template
4. Ensure React versions match (^18.3.1)
5. Clear browser cache and localStorage
6. Review the main dashboard README

## Resources

- [Module Federation Docs](https://module-federation.io/)
- [Vite Plugin Federation](https://github.com/originjs/vite-plugin-federation)
- [Dashboard Repository](https://github.com/YOUR_USERNAME/dashboard)
- [Widget Template](../widget-template/)
