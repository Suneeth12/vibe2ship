# Frontend Specification: Community Hero

## 1. Application Architecture

```
/client
├── src/
│   ├── main.tsx                      # App entry point
│   ├── App.tsx                       # Router setup + global providers
│   ├── config/
│   │   ├── firebase.ts               # Firebase client SDK init
│   │   └── env.ts                    # VITE_ env var validation
│   ├── hooks/
│   │   ├── useAuth.ts                # Firebase Auth state + token management
│   │   ├── useIssues.ts              # Firestore real-time issue listener
│   │   ├── useGeolocation.ts         # GPS position with error handling
│   │   ├── useOfflineDraft.ts        # IndexedDB + localStorage offline storage
│   │   └── useDebounce.ts            # Debounce for search/submit inputs
│   ├── services/
│   │   ├── api.ts                    # Axios instance with auth interceptor
│   │   ├── sanitize.ts              # DOMPurify wrapper for all UGC
│   │   ├── exif.ts                   # EXIF extraction + GPS stripping
│   │   ├── imageCompress.ts          # Canvas-based resize to 1200px max
│   │   └── offlineSync.ts            # Background sync when online
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx             # Split-screen container (55/45)
│   │   │   ├── Sidebar.tsx           # Navigation + user info
│   │   │   └── MobileNav.tsx         # Bottom tab bar for mobile
│   │   ├── map/
│   │   │   ├── MapView.tsx           # Leaflet + Google tiles
│   │   │   ├── IssueMarker.tsx       # Color-coded SVG pin
│   │   │   ├── HotspotOverlay.tsx    # Red circle heatmap zones
│   │   │   └── MapControls.tsx       # Zoom, center, filter buttons
│   │   ├── issues/
│   │   │   ├── IssueFeed.tsx         # Scrollable card list
│   │   │   ├── IssueCard.tsx         # Bento card with status badge
│   │   │   ├── IssueDetail.tsx       # Full detail panel with timeline
│   │   │   ├── ReportForm.tsx        # Camera upload + description
│   │   │   └── StatusTimeline.tsx    # Step-by-step progress tracker
│   │   ├── verification/
│   │   │   ├── VotePanel.tsx         # Confirm/Spam buttons + score
│   │   │   └── ConsensusBar.tsx      # Visual progress to threshold
│   │   ├── gamification/
│   │   │   ├── Leaderboard.tsx       # Top contributors table
│   │   │   ├── BadgeGallery.tsx      # Earned badges display
│   │   │   └── PointsCounter.tsx     # Animated points display
│   │   └── ui/
│   │       ├── Button.tsx            # Primary/secondary/ghost variants
│   │       ├── Input.tsx             # Dark filled input with label
│   │       ├── Badge.tsx             # Pill-shaped status indicator
│   │       ├── Skeleton.tsx          # Shimmer loading card
│   │       ├── Toast.tsx             # Notification popup
│   │       └── DoubleBezel.tsx       # Doppelrand container wrapper
│   ├── pages/
│   │   ├── Dashboard.tsx             # Main split-screen view
│   │   ├── Report.tsx                # Issue reporting flow
│   │   ├── Profile.tsx               # User stats + badges
│   │   ├── Login.tsx                 # Auth entry page
│   │   └── AdminDashboard.tsx        # City operator view (future)
│   ├── styles/
│   │   ├── index.css                 # Design system tokens + resets
│   │   ├── components.css            # Component-level styles
│   │   └── animations.css            # Spring physics keyframes
│   └── utils/
│       ├── constants.ts              # Enums, thresholds, limits
│       ├── validation.ts             # Client-side input validators
│       └── format.ts                 # Date, distance, coordinate formatters
├── public/
│   ├── fonts/                        # Self-hosted: Cabinet Grotesk, Satoshi, JetBrains Mono
│   └── icons/                        # SVG icon sprites
├── index.html                        # Root HTML with CSP meta tag
├── vite.config.ts                    # Build config (no source maps, strip console)
├── package.json
├── tsconfig.json
└── .env                              # (gitignored) VITE_ vars
```

---

## 2. Security Implementation

### 2.1 XSS Prevention
```typescript
// services/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],  // Strip ALL HTML by default
    ALLOWED_ATTR: [],
  });
}

export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
}
```

**Usage Rules:**
- ALL user-generated text rendered via `sanitize()` before display
- ALL Gemini AI output sanitized before render (AI responses can contain HTML)
- Firebase `displayName` sanitized on render
- NEVER use `dangerouslySetInnerHTML` without `sanitizeRichText()` wrapper
- React JSX `{}` auto-escapes but sanitize anyway for defense-in-depth

### 2.2 URL Parameter Validation
```typescript
// utils/validation.ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateIssueId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function safeRedirect(path: string): string {
  const ALLOWED_PREFIXES = ['/dashboard', '/issue/', '/map', '/profile', '/report'];
  if (ALLOWED_PREFIXES.some(p => path.startsWith(p))) return path;
  return '/dashboard';
}
```

### 2.3 Client-Side Upload Validation
```typescript
// utils/validation.ts
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_DURATION = 15;           // seconds

// Magic byte signatures
const JPEG_MAGIC = [0xFF, 0xD8, 0xFF];
const PNG_MAGIC = [0x89, 0x50, 0x4E, 0x47];

export async function validateUpload(file: File): Promise<{ valid: boolean; error?: string }> {
  // 1. Check MIME type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) return { valid: false, error: 'Unsupported file type' };

  // 2. Check size
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) return { valid: false, error: `File too large (max ${maxSize / 1024 / 1024}MB)` };

  // 3. Validate magic bytes for images
  if (isImage) {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isJpeg = JPEG_MAGIC.every((b, i) => bytes[i] === b);
    const isPng = PNG_MAGIC.every((b, i) => bytes[i] === b);
    if (!isJpeg && !isPng && file.type !== 'image/webp') {
      return { valid: false, error: 'File content does not match type' };
    }
  }

  // 4. Check video duration
  if (isVideo) {
    const duration = await getVideoDuration(file);
    if (duration > MAX_VIDEO_DURATION) {
      return { valid: false, error: `Video too long (max ${MAX_VIDEO_DURATION}s)` };
    }
  }

  return { valid: true };
}
```

### 2.4 EXIF Extraction + Stripping
```typescript
// services/exif.ts
export async function extractAndStripExif(file: File): Promise<{
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  cleanBlob: Blob;
}> {
  // 1. Extract GPS coordinates from EXIF
  const exifData = await readExif(file);
  const latitude = exifData?.GPSLatitude;
  const longitude = exifData?.GPSLongitude;
  const timestamp = exifData?.DateTimeOriginal;

  // 2. Strip ALL EXIF by re-encoding through Canvas
  const cleanBlob = await reencodeImage(file, { maxWidth: 1200, quality: 0.85 });

  return { latitude, longitude, timestamp, cleanBlob };
}

async function reencodeImage(file: File, opts: { maxWidth: number; quality: number }): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, opts.maxWidth / Math.max(img.width, img.height));
  const canvas = new OffscreenCanvas(img.width * scale, img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: 'image/jpeg', quality: opts.quality });
}
```

### 2.5 Offline Storage Security
```typescript
// hooks/useOfflineDraft.ts
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveDraft(draft: DraftIssue): void {
  const entry = {
    data: draft,
    savedAt: Date.now(),
  };
  localStorage.setItem(`draft_${draft.id}`, JSON.stringify(entry));
}

export function loadDrafts(): DraftIssue[] {
  const drafts: DraftIssue[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('draft_')) {
      const entry = JSON.parse(localStorage.getItem(key)!);
      if (Date.now() - entry.savedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(key); // Auto-purge expired
      } else {
        drafts.push(entry.data);
      }
    }
  }
  return drafts;
}

export function clearAllDrafts(): void {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('draft_')) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
}
```

---

## 3. Vite Production Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,            // No source maps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Strip console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 4. Design System Tokens (CSS Custom Properties)

```css
/* styles/index.css */
:root {
  /* Canvas */
  --canvas-ink: #0B0C0E;
  --surface-gray: #16181C;
  --surface-input: #1F2126;

  /* Text */
  --text-high: #F4F4F5;
  --text-muted: #A1A1AA;

  /* Accent */
  --civic-emerald: #14B8A6;
  --civic-emerald-active: #0D9488;
  --civic-emerald-10: rgba(20, 184, 166, 0.1);

  /* Structure */
  --whisper-line: rgba(255, 255, 255, 0.06);
  --outer-shell-bg: rgba(255, 255, 255, 0.02);
  --outer-shell-border: rgba(255, 255, 255, 0.04);
  --inner-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

  /* Status */
  --status-critical: #EF4444;
  --status-warning: #F59E0B;
  --status-success: #22C55E;
  --status-info: #3B82F6;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-24: 96px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Cabinet Grotesk', sans-serif;
  --font-body: 'Satoshi', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Motion */
  --spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --spring-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Touch */
  --min-touch-target: 44px;
}
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 768px | Single column, bottom nav, full-width map toggle |
| Tablet | 768px - 1024px | Stacked 60/40, collapsible sidebar |
| Desktop | > 1024px | Split-screen 55% map / 45% feed |

---

## 6. Required NPM Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@phosphor-icons/react": "^2.1.5",
    "axios": "^1.7.2",
    "firebase": "^10.12.2",
    "dompurify": "^3.1.5",
    "piexifjs": "^1.0.6"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/leaflet": "^1.9.12",
    "@types/dompurify": "^3.0.5",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "terser": "^5.31.0"
  }
}
```
