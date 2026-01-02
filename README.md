# Micro-Frontend Dashboard

A modular dashboard application that dynamically loads widget components from remote repositories using **Vite + React + Module Federation**. Each widget is independently developed, built, and deployed to its own GitHub Pages site, then pulled into the dashboard at runtime.

## Features

- **Independent Widgets**: Each widget is a separate repository with its own build/deploy cycle
- **Runtime Integration**: Widgets loaded dynamically at runtime via Module Federation
- **localStorage Configuration**: Widget config stored in browser, persists across sessions
- **Export/Import Config**: Download and upload widget configurations as JSON
- **Live Config Editor**: Edit widget configuration directly in the UI
- **No Dashboard Rebuilds**: Add/remove widgets via UI - no code changes needed
- **Shared Dependencies**: React is shared as a singleton across all widgets
- **GitHub Pages Native**: Everything hosted for free on GitHub Pages
- **Error Boundaries**: Widgets fail gracefully without crashing the dashboard
- **Responsive Layout**: Automatic grid layout that adapts to screen size

## Architecture

```
Dashboard (Main App)
├── Reads public/widgets.json
├── Dynamically imports widgets via Module Federation
└── Renders widgets in responsive grid

Widgets (Remote Repositories)
├── Independent Vite + React apps
├── Expose components via Module Federation
└── Deploy to GitHub Pages
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Local Development

The dashboard will show an empty state until you configure widgets in `public/widgets.json`.

## Configuring Widgets

Edit `public/widgets.json` to add widgets to your dashboard:

```json
{
  "gridColumns": 3,
  "widgets": [
    {
      "name": "Weather",
      "url": "https://YOUR_USERNAME.github.io/weather-widget",
      "cols": 2,
      "rows": 1,
      "props": {
        "city": "San Francisco"
      }
    },
    {
      "name": "Todo List",
      "url": "https://YOUR_USERNAME.github.io/todo-widget"
    }
  ]
}
```

### Configuration Fields

#### Global Configuration

- **gridColumns** *(optional)*: Number of columns in the dashboard grid
  - Defaults to `3` if not provided
  - Responsive: automatically adjusts to 2 columns on tablets, 1 column on mobile

#### Widget Configuration

Only **name** and **url** are required. All other fields have sensible defaults:

- **name** *(required)*: Display name shown in the widget header
- **url** *(required)*: Base URL where the widget is hosted (GitHub Pages URL)
- **id** *(optional)*: Unique identifier for the widget
  - Auto-generated from `name` (kebab-case) + random suffix if not provided
  - Example: `"Weather"` → `"weather-a4f2"`
- **module** *(optional)*: Module path to import
  - Defaults to `"./Widget"` if not provided
- **cols** *(optional)*: Number of grid columns the widget spans
  - Defaults to `1` if not provided
  - Example: `"cols": 2` makes widget twice as wide
- **rows** *(optional)*: Number of grid rows the widget spans
  - Defaults to `1` if not provided
  - Example: `"rows": 2` makes widget twice as tall
- **props** *(optional)*: Props to pass to the widget component
  - Defaults to `{}` if not provided
- **scope** *(optional)*: Module Federation scope name
  - Not actively used by the loader (Module Federation handles this automatically)
  - Safe to omit unless you need it for documentation purposes

### Grid Layout Examples

**Standard 3-column grid:**
```json
{
  "gridColumns": 3,
  "widgets": [
    { "name": "Widget 1", "url": "..." },
    { "name": "Widget 2", "url": "..." },
    { "name": "Widget 3", "url": "..." }
  ]
}
```

**4-column grid with a featured widget spanning 2 columns:**
```json
{
  "gridColumns": 4,
  "widgets": [
    { "name": "Featured", "url": "...", "cols": 2 },
    { "name": "Small 1", "url": "..." },
    { "name": "Small 2", "url": "..." }
  ]
}
```

**Mixed layout with different sizes:**
```json
{
  "gridColumns": 3,
  "widgets": [
    { "name": "Large", "url": "...", "cols": 2, "rows": 2 },
    { "name": "Tall", "url": "...", "rows": 2 },
    { "name": "Wide", "url": "...", "cols": 2 },
    { "name": "Regular", "url": "..." }
  ]
}
```

## Managing Configuration

The dashboard includes a built-in configuration manager accessible via the **⚙️ Configure** button in the header.

### Configuration Storage

Widget configuration uses a priority system:
1. **localStorage** (browser storage) - checked first
2. **public/widgets.json** - fallback default

Once you make changes via the UI, they're saved to localStorage and persist across browser sessions. The `widgets.json` file only loads when localStorage is empty (first visit).

### Config Manager Features

#### 📥 Export Configuration
Download your current widget configuration as a JSON file. Useful for:
- Backing up your configuration
- Sharing configurations with others
- Moving configurations between browsers/devices

#### 📤 Import from File
Upload a previously exported JSON configuration file. The dashboard will:
- Validate the JSON format
- Load all widgets from the imported config
- Save to localStorage automatically

#### ✏️ Edit Mode
Manually edit the widget configuration JSON in a built-in editor:
- Live JSON editing with syntax highlighting
- Validation on save
- Cancel to discard changes
- Useful for quick edits or adding new widgets

#### 🔄 Reset to Default
Clear localStorage and reload the default `public/widgets.json` configuration:
- Removes all custom changes
- Restarts with fresh defaults
- Requires confirmation to prevent accidental resets

### Managing Widgets via UI

**To add a new widget:**
1. Click **⚙️ Configure**
2. Click **✏️ Edit Mode**
3. Add your widget to the JSON array
4. Click **💾 Save Changes**

**To remove a widget:**
1. Click **⚙️ Configure**
2. Click **✏️ Edit Mode**
3. Remove the widget from the JSON array
4. Click **💾 Save Changes**

**To backup your configuration:**
1. Click **⚙️ Configure**
2. Click **📥 Export Configuration**
3. JSON file downloads automatically

**To restore from backup:**
1. Click **⚙️ Configure**
2. Click **📤 Import from File**
3. Select your exported JSON file

## Creating a New Widget

Use the `widget-template/` directory as a starting point:

1. Copy `widget-template/` to a new repository
2. Update `package.json` name and details
3. Update `vite.config.js`:
   - Change `name` to match your widget scope
   - Change `base` to match your repository name
4. Develop your widget in `src/Widget.jsx`
5. Test locally with `npm run dev`
6. Push to GitHub and enable GitHub Pages
7. Add your widget to the dashboard's `widgets.json`

See `widget-template/README.md` for detailed widget development instructions.

## Deployment to GitHub Pages

### Using GitHub Actions (Recommended)

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on push to `main`.

1. Enable GitHub Pages in repository settings:
   - Go to Settings > Pages
   - Source: GitHub Actions

2. Update `vite.config.js` if your repository name is not "dashboard":
   ```js
   base: '/YOUR_REPO_NAME/'
   ```

3. Push to main branch - deployment happens automatically

### Manual Deployment

```bash
npm run build
# Deploy the dist/ folder to GitHub Pages manually or using gh-pages package
```

## Project Structure

```
dashboard/
├── .github/workflows/deploy.yml    # GitHub Actions deployment
├── public/
│   └── widgets.json                # Widget configuration
├── src/
│   ├── components/
│   │   ├── WidgetContainer.jsx     # Widget wrapper with error boundary
│   │   └── WidgetGrid.jsx          # Responsive grid layout
│   ├── hooks/
│   │   └── useWidgets.jsx          # Widget loading logic
│   ├── utils/
│   │   └── widgetLoader.js         # Module Federation loader
│   ├── App.jsx                     # Main application
│   ├── App.css                     # Dashboard styles
│   └── main.jsx                    # Entry point
├── widget-template/                # Template for creating new widgets
├── vite.config.js                  # Vite + Module Federation config
└── package.json
```

## How It Works

### Module Federation

This dashboard uses Webpack Module Federation (via Vite plugin) to load remote JavaScript modules at runtime:

1. **Dashboard** is configured as a "consumer" with no predefined remotes
2. **Widgets** are configured as "remotes" that expose their components
3. At runtime, the dashboard dynamically imports `remoteEntry.js` from each widget URL
4. React is shared as a singleton to prevent duplicate library loads

### Widget Loading Flow

1. Dashboard fetches `widgets.json` on startup
2. For each widget, it dynamically imports the remote `remoteEntry.js`
3. The remote container is initialized with shared scope (React)
4. The widget component is extracted and rendered
5. Error boundaries catch any widget failures

## Troubleshooting

### Widget fails to load

- Check browser console for CORS errors
- Verify the widget URL is correct and accessible
- Ensure the widget's `vite.config.js` has correct `base` path
- Verify widget's GitHub Pages is enabled and deployed

### React duplicate error

- Ensure both dashboard and widget have `singleton: true` for React in their Module Federation config
- Check that React versions are compatible

### Assets not loading after deployment

- Verify `base` path in `vite.config.js` matches your repository name
- GitHub Pages URLs are case-sensitive

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **Module Federation** - Micro-frontend architecture
- **GitHub Pages** - Free hosting
- **GitHub Actions** - CI/CD

## Resources

- [Module Federation Docs](https://module-federation.io/)
- [Vite Module Federation Plugin](https://github.com/originjs/vite-plugin-federation)
- [Micro-Frontend Architecture](https://martinfowler.com/articles/micro-frontends.html)
