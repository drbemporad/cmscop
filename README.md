# Pocket CoP

**42 CFR Part 482 — CMS Conditions of Participation**  
Mobile reference app for inpatient psychiatric hospitals. Covers CoP regulatory text and CMS SOM Interpretive Guidelines.

---

## Deploy to GitHub Pages (5 minutes)

### 1. Create a GitHub repository
- Go to [github.com](https://github.com) → **New repository**
- Name it anything, e.g. `pocket-cop`
- Set to **Public** (required for free GitHub Pages)
- Click **Create repository**

### 2. Upload the files
- Click **Add file → Upload files**
- Drag in all files from this folder:
  - `index.html`
  - `sw.js`
  - `app.js`
  - `data.js`
  - `style.css`
  - `manifest.json`
  - `icon-192.png`
  - `icon-512.png`
- Commit directly to `main`

### 3. Enable GitHub Pages
- Go to **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **main** / **(root)**
- Click **Save**
- Your URL will be: `https://YOUR-USERNAME.github.io/pocket-cop/`

### 4. Install on Android
1. Open the URL in **Chrome on Android**
2. Wait a few seconds for the page to fully load
3. Tap the **three-dot menu → Add to Home Screen**
4. Tap **Add** — the Pocket CoP icon appears on your home screen
5. Open it once while online — it caches everything for offline use

---

## Updating the app

When you push new files to GitHub:

1. The next time someone opens the app with an internet connection, Chrome detects the new `sw.js`
2. A **green banner** appears at the bottom: *"A new version of Pocket CoP is ready"*
3. Tap **Update now** — the app reloads with the new version

**To push an update:**
1. Edit your files
2. Open `sw.js` and change the `CACHE_NAME` version string — e.g. `pocket-cop-v1.1`
3. Upload changed files to GitHub
4. GitHub Pages deploys in ~1 minute

---

## File structure

```
pocket-cop/
├── index.html      # App shell and HTML structure
├── style.css       # All styles
├── data.js         # CoP and IG regulatory data arrays
├── app.js          # App logic + service worker registration
├── sw.js           # Service worker (offline cache + update detection)
├── manifest.json   # PWA manifest (name, icons, display mode)
├── icon-192.png    # Home screen icon
├── icon-512.png    # Splash screen / Play Store icon
└── README.md       # This file
```

---

*Forensic Psychiatry Solutions, PLLC*
