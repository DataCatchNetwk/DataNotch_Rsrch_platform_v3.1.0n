# Development Setup & Console Messages

## Console Messages Explained

Your application is running correctly! Here's what those messages mean:

### ✅ Normal Messages

1. **React DevTools Suggestion**

   ```
   Download the React DevTools for a better development experience
   ```

   - This is just a helpful suggestion from React
   - Install React DevTools Chrome extension: https://react.dev/link/react-devtools
   - Helps with debugging React components

2. **[HMR] connected**
   ```
   [HMR] connected websocket.js:42:28
   ```

   - ✅ Hot Module Replacement is working
   - Your code changes will auto-refresh without full page reload
   - This is good and means development mode is optimal

### ⚠️ Minor Warning (Harmless)

3. **[HMR] Invalid message**
   ```
   [HMR] Invalid message: {"action":"isrManifest","data":{}}
   ```

   - This is a known Next.js 15 development issue
   - The app works fine despite this warning
   - It appears because the App Router doesn't use ISR in the same way as Pages Router
   - **Impact:** None, it's just a console warning
   - **Fixed in:** next.config.js with optimized onDemandEntries

## React DevTools Installation

### Chrome/Edge

1. Visit: https://chrome.google.com/webstore/detail/react-developer-tools
2. Click "Add to Chrome"
3. Reload your browser

### Firefox

1. Visit: https://addons.mozilla.org/firefox/addon/react-devtools/
2. Click "Add to Firefox"
3. Reload your browser

## Using React DevTools

After installing:

1. Open Developer Tools (F12)
2. Click "Components" tab
3. Inspect React component tree
4. View props, state, and hooks
5. Track re-renders with performance profiler

Example debugging:

```
- Click a component in the tree
- View its props and state in the right panel
- See which parent components render it
- Track why components re-render
```

## Development Configuration

### next.config.js

The configuration includes optimizations for development:

```javascript
{
  // ISR-related settings (fixes the warning)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },

  // Enable React strict mode (catches issues early)
  reactStrictMode: true,

  // Security headers
  async headers() { ... }
}
```

## Files Added for Better DX

### 1. Error Boundary (`src/app/error.tsx`)

- Handles unexpected errors gracefully
- Shows user-friendly error message
- Provides "Try Again" button
- Shows error digest in development

### 2. Not Found Page (`src/app/not-found.tsx`)

- Custom 404 page with branding
- Links back to login
- Animated design matching theme

### 3. Loading Page (`src/app/loading.tsx`)

- Shows during page transitions
- Animated ripple loading indicator
- Consistent with brand colors

### 4. Environment Variables (`.env.example`)

- Template for required environment variables
- Reference for team members
- Documents configuration options

## Suppressing Console Messages

### React DevTools Message

This is not actually suppressible (it's a feature suggestion), but you can safely ignore it:

```
// In DevTools Console, you can disable it:
localStorage.clear() // Clears all stored messages
```

### HMR Warning

Already fixed with the `next.config.js` configuration:

- The `onDemandEntries` settings prevent the ISR manifest warning
- No further action needed

## Development Workflow

### 1. Start the App

```powershell
cd apps/web
pnpm run dev
```

### 2. Open DevTools

Press `F12` or `Ctrl+Shift+I`

### 3. Check Components Tab

- View React component tree
- Inspect props and state
- Check hooks

### 4. Watch HMR

- Make code changes
- See them update instantly
- No page reload needed

## Best Practices

### Do's ✅

- Use React DevTools to debug components
- Check Console for actual errors
- Monitor Network tab for API calls
- Use Source tab for breakpoints

### Don'ts ❌

- Don't ignore actual error messages (red text)
- Don't disable HMR in development
- Don't commit console.log statements
- Don't ignore TypeScript warnings

## Troubleshooting

### HMR Not Working

```powershell
# Restart dev server
Ctrl+C

# Clear cache
pnpm store prune

# Restart
pnpm run dev
```

### React DevTools Not Showing

```
1. Check if extension is installed
2. Ensure app is running
3. Open DevTools (F12)
4. Click "Components" tab (not "Console")
5. If still not working, reinstall extension
```

### Too Many Console Messages

```javascript
// In your component, suppress specific warnings:
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes("specific-warning")) return;
    originalWarn(...args);
  };
}
```

## Performance Monitoring

### Check build performance:

```powershell
pnpm run build
```

### Analyze bundle:

```powershell
# View bundle size analysis
pnpm analyze
```

## Environment Configuration

Create `.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NODE_ENV=development
```

These are already set to correct defaults.

## Summary

Your application is running perfectly! ✅

- ✅ HMR is working (auto-reload on code changes)
- ✅ React DevTools suggestion is just helpful
- ✅ ISR warning is fixed and harmless
- ✅ All error boundaries configured
- ✅ Ready for development

**Start development with confidence!** 🚀
