# Hindi Flashcards — PWA Setup Guide

## File Placement

Your Vite project structure should look like this after placing all files:

```
hindi-flashcards/
├── index.html                    ← REPLACE with pwa-files/index.html
├── public/
│   ├── manifest.json             ← NEW (from pwa-files/public/)
│   ├── sw.js                     ← NEW (from pwa-files/public/)
│   ├── offline.html              ← NEW (from pwa-files/public/)
│   ├── apple-touch-icon.png      ← NEW (from pwa-files/public/)
│   └── icons/                    ← NEW FOLDER (from pwa-files/public/icons/)
│       ├── favicon-32.png
│       ├── icon-72.png
│       ├── icon-96.png
│       ├── icon-128.png
│       ├── icon-144.png
│       ├── icon-152.png
│       ├── icon-180.png
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.jsx                   ← REPLACE with updated App.jsx
│   ├── cards.js                  ← REPLACE with updated cards.js
│   └── firebase.js               ← (unchanged)
└── ...
```

## Step-by-Step Deployment

### 1. Replace index.html
Copy `pwa-files/index.html` to your project ROOT (not src/).
⚠️ Keep your existing Google Search Console meta tag — replace the placeholder in the new file.

### 2. Copy PWA static files to public/
```bash
cp pwa-files/public/manifest.json  public/
cp pwa-files/public/sw.js          public/
cp pwa-files/public/offline.html   public/
cp pwa-files/public/apple-touch-icon.png public/
cp -r pwa-files/public/icons       public/
```

### 3. Replace src/App.jsx and src/cards.js
```bash
cp App.jsx  src/App.jsx
cp cards.js src/cards.js
```

### 4. Deploy
```bash
git add .
git commit -m "PWA: installable on iOS, Android, desktop + streak calendar + audio fixes"
git push
```
Vercel auto-deploys from main branch.

## What Changed

### PWA Files (new)
| File | Purpose |
|------|---------|
| `manifest.json` | App name, icons, display mode, colors |
| `sw.js` | Service worker: caches assets, offline fallback |
| `offline.html` | Shown when user is offline |
| `icons/*` | 8 PNG sizes (72–512px) for all platforms |
| `apple-touch-icon.png` | iOS home screen icon (180px) |

### index.html (updated)
- PWA manifest link
- iOS Safari meta tags (apple-mobile-web-app-capable, etc.)
- Service worker registration script
- Viewport with viewport-fit=cover

### App.jsx (updated)
- `usePWAInstall()` hook — handles beforeinstallprompt, platform detection, standalone detection
- Install App button in Settings (shows for iOS/Android/Desktop)
- iOS instruction modal (tap Share → Add to Home Screen)
- Hides install button when already running as PWA
- Tutorial updated with PWA install step (step 7 of 8)

## How Install Works

| Platform | Behavior |
|----------|----------|
| **Android (Chrome)** | "Install App" button captures `beforeinstallprompt` → triggers native install dialog |
| **iOS (Safari)** | "Install App" button shows a modal with instructions: Share → Add to Home Screen |
| **Desktop (Chrome/Edge)** | Same as Android — uses `beforeinstallprompt` |
| **Already installed** | Shows "Already installed" badge instead of button |
| **Unsupported browser** | Install button hidden entirely (no dead buttons) |

## Testing PWA

1. Open Chrome DevTools → Application tab → Manifest (verify manifest loads)
2. Application → Service Workers (verify sw.js registered)
3. Lighthouse → check PWA score
4. On Android: look for install banner or use Settings → Install App
5. On iOS Safari: use Settings → Install App (shows instructions)
