# PlayM3U Web

IPTV Player web app — ported from Android to a full Next.js PWA.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Static Export) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Streaming | HLS.js |
| State | Zustand (persisted) |
| Data/Cache | TanStack Query v5 |
| Build | `next build` → static HTML/CSS/JS |
| PWA | Custom Service Worker (offline UI + playlist cache) |
| Background | Web Worker (M3U parsing off main thread) |

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx          ← Root layout + metadata + SW registration
│   ├── page.tsx            ← Entry point (renders AppShell)
│   ├── providers.tsx       ← QueryClient + ServiceWorker bootstrap
│   └── globals.css         ← Tailwind base + custom animations
│
├── types/index.ts          ← Channel, Playlist, AppSettings, etc.
│
├── workers/
│   └── m3u.worker.ts       ← Web Worker: M3U parser (off main thread)
│                             Supports Pattern A / B / C from original app
│
├── hooks/
│   ├── useM3UWorker.ts     ← Manages worker lifecycle, returns parse()
│   ├── useHLSPlayer.ts     ← HLS.js core: loadChannel, togglePlay
│   ├── usePlaylistQuery.ts ← TanStack Query: fetch + cache M3U playlists
│   └── useTouchSwipe.ts    ← Touch swipe gestures for player
│
├── store/
│   └── index.ts            ← Zustand stores:
│                             · usePlaylistStore  (playlists, current idx)
│                             · useSettingsStore  (all app settings)
│                             · useUIStore        (page navigation, panels)
│                             · usePlayerStore    (player state, volume)
│
├── components/
│   ├── AppShell.tsx         ← Page router / navigator
│   ├── ui/
│   │   └── primitives.tsx   ← Button, Input, Badge, Toggle, Spinner…
│   ├── playlist/
│   │   ├── WelcomePage.tsx  ← First-run onboarding
│   │   ├── AddPlaylistFlow.tsx ← Source → URL input → Name & save
│   │   └── PlaylistsPage.tsx   ← Manage / update / delete playlists
│   ├── player/
│   │   ├── PlayerPage.tsx   ← Main player (video + radio + OSD + controls)
│   │   ├── ChannelList.tsx  ← Sidebar: search, categories, groups
│   │   ├── ChannelInfoOSD.tsx ← Overlay styles: default/wide/compact/detail
│   │   ├── PlayerControls.tsx ← Bottom controls bar
│   │   └── RadioUI.tsx      ← Aurora bg + vinyl disc + EQ bars
│   └── settings/
│       ├── DashboardPage.tsx ← Home dashboard with clock
│       └── SettingsPanel.tsx ← Slide-over settings panel
│
public/
├── sw.js                   ← Service Worker (offline + playlist cache)
├── offline.html            ← Offline fallback page
├── manifest.json           ← PWA manifest
└── icons/                  ← PWA icons (192 + 512)
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Build & export static files

```bash
npm run build
```

Output is in `out/` — deploy to any static host (Netlify, Vercel, GitHub Pages, Nginx, etc.)

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Nginx (self-hosted)

```bash
npm run build
# Copy out/ to your server
cp -r out/ /var/www/playm3u/

# Nginx config:
# location / {
#   root /var/www/playm3u;
#   try_files $uri $uri/ /index.html;
# }
```

### GitHub Pages

Add this to `next.config.js`:
```js
basePath: '/your-repo-name'
```

Then push `out/` to the `gh-pages` branch.

---

## Features

### Playlist Management
- Add playlists via URL (M3U/M3U8) or local file
- Auto-refresh on open option
- Multiple playlists with quick-switch
- CORS-proxy fallback (corsproxy.io / allorigins.win)

### Player
- HLS.js adaptive bitrate streaming
- DASH / progressive / direct stream support
- Native HLS fallback (Safari)
- Auto-detect radio mode (audio-only streams)
- Swipe up/down to change channel
- Swipe right to open channel list
- Keyboard: ↑↓ = prev/next, Space = play/pause, Esc = close

### Channel List
- Search channels by name or group
- Filter by: All / TV / Radio / Group
- Live EQ animation on active channel
- DRM indicator

### Radio Mode
- Aurora gradient animated background
- Vinyl disc with album art (spinning)
- EQ bars visualizer
- Now-playing text support

### OSD Overlays
- **Default** — bottom-left card
- **Wide** — bottom full-width bar
- **Compact** — top bar
- **Detail** — right-side panel with full info

### Settings
- Resolution: Auto / Low / High
- Buffer: 10s / 30s / 60s / 2min
- Radio background: Aurora / Breathing / Solid / Sweep / Blur
- Radio cover: Vinyl / Album Art / Logo
- Font size, nav hints, landscape mode

### PWA
- Installable on Android, iOS, Desktop
- Offline fallback page
- Playlist content cached via Service Worker
- App shell cached (instant load after first visit)

---

## M3U Parser

The Web Worker parser (`src/workers/m3u.worker.ts`) is a full TypeScript port of the original `M3UParser.java`. It supports:

- **Pattern A** (standard): `#EXTINF → [meta] → URL`
- **Pattern B** (common): `#EXTINF → URL → [meta]`
- **Pattern C**: `[meta] → #EXTINF → URL`

Metadata supported:
- `tvg-logo`, `group-title` (from `#EXTINF`)
- `#EXTVLCOPT:http-user-agent`
- `#EXTVLCOPT:http-referrer`
- `#KODIPROP:inputstream.adaptive.license_type` (ClearKey / Widevine)
- `#KODIPROP:inputstream.adaptive.license_key`

---

## Browser Support

| Browser | HLS | Status |
|---|---|---|
| Chrome / Edge | via HLS.js | ✅ Full |
| Firefox | via HLS.js | ✅ Full |
| Safari (iOS/macOS) | Native HLS | ✅ Full |
| Samsung Internet | via HLS.js | ✅ Full |

---

## CORS Note

Most IPTV streams and M3U URLs require CORS headers. The app tries:
1. Direct fetch
2. `https://corsproxy.io/?<url>`
3. `https://api.allorigins.win/raw?url=<url>`

For self-hosted deployments, consider adding a lightweight proxy.

---

## License

MIT
