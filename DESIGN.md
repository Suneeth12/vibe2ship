# Design System: Community Hero

## 1. Visual Theme & Atmosphere
* **Aesthetic Tone:** Clinical warm civic workspace. Clean, highly structured layouts designed to look like a high-end municipal command center. Warm and human, avoiding cold clinical utility.
* **Layout Mockup Reference:**
  * Layout visualization is represented by the generated UI mockup: [community_hero_ui_1782236223013.png](file:///C:/Users/sunee/.gemini/antigravity/brain/cc056499-b7ff-4c74-ae7c-e53df6036aed/community_hero_ui_1782236223013.png)
* **Dial Settings:**
  * **Visual Density:** 8/10 (Cockpit Mode). Packed, information-dense display utilizing thin dividers and whitespace hierarchy instead of thick boxes.
  * **Layout Variance:** 7/10 (Offset Asymmetric). Asymmetric column scales, split viewports, and uneven grid cards to break standard template patterns.
  * **Motion Intensity:** 6/10 (Fluid Spring). Interactive elements animate using weighty, physics-based springs instead of sterile linear transitions.
* **Spatial Rhythm:** Generous vertical section padding (`py-24` on desktop) contrasted with compact, high-density dashboard feeds (`p-4` inside feed cards).

## 2. Color Palette & Roles
* **Canvas Ink (#0B0C0E):** Primary deep charcoal-black background base. Never use pure black (`#000000`).
* **Surface Gray (#16181C):** Container panels, sidebar backgrounds, and active card zones.
* **Text High-Contrast (#F4F4F5):** H1, H2, primary button labels, and critical values.
* **Text Muted (#A1A1AA):** Descriptions, coordinates, secondary labels, and metadata.
* **Civic Emerald (#14B8A6):** Single brand accent color. Used for active state highlights, verified pins, primary button backgrounds, and progress meters. Calibrated for WCAG AA accessibility contrast.
* **Civic Emerald Active (#0D9488):** Focus states and hovers.
* **Whisper Line (rgba(255, 255, 255, 0.06)):** 1px structural dividing lines, table borders, and container edges.
* **Banned:** Neon shadows, gradients, and the "AI Purple/Blue Neon" aesthetic.

## 3. Typographic Architecture
* **Display & Headings:** `Cabinet Grotesk` (Track-tight `-0.02em` for H1/H2, heavy weights, uppercase/lowercase contrast, controlled scale).
* **Body & UI Elements:** `Satoshi` (Balanced geometric sans-serif, high readability in small UI widgets, `1.5` line-height).
* **Mono & Numeric UI:** `JetBrains Mono` (Used for geospatial coordinates, issue timestamps, ID hashes, and quantitative metrics).
* **Technical UI Rule:** Serif fonts are strictly BANNED. Monospace is mandatory for all numbers to prevent layout shifting on updates.
* **Banned:** `Inter`, generic system defaults, and emojis.

## 4. Component Stylings (Double-Bezel Architecture)
* **Double-Bezel Containers (Doppelrand):**
  * Card components must look like machined hardware sitting in a tray.
  * **Outer Shell:** Wrapper div with background `rgba(255,255,255,0.02)`, outer border `1px solid rgba(255,255,255,0.04)`, padding `p-1.5`, and large outer radius `rounded-[2rem]`.
  * **Inner Core:** Actual content container with background `#16181C`, inner shadow `inset 0 1px 0 rgba(255,255,255,0.05)`, and inner radius `rounded-[calc(2rem-0.375rem)]`.
* **Buttons:**
  * **Primary:** Civic Emerald fill, Canvas Ink label. Tactile click feedback (`active:scale-[0.98]`).
  * **Button-in-Button Arrow:** Trailing arrow icons (`↗`) must be nested inside their own circular wrapper (`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center`) placed flush with the button's right padding.
* **Inputs & Form Controls:**
  * Label always positioned above input. Dark filled container (`#1F2126`), 1px Whisper Line border.
  * Focus: Civic Emerald border outline (2px), no glow. Red border (`#EF4444`) for errors.
* **Verification Badges:**
  * Pill-shaped tag (`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium`).
  * `Verified` = Civic Emerald text, transparent background, Civic Emerald border (1px).
* **Loaders:**
  * Skeleton cards matching feed item dimensions utilizing background-position shimmer. No circular spinners.

## 5. Layout & Spatial Principles
* **Split-Screen Map Interface:** Viewport locked to `100dvh`. Left 55% = interactive map showing glowing teal markers; right 45% = scrollable issue feed & detail panel.
* **Asymmetrical Bento Grid:** Layout uses a masonry-style CSS Grid of varying card sizes to display community metrics.
* **Mobile Collapse:** Multi-column layouts aggressively collapse to a single column (`grid-cols-1`, `w-full`, `px-4`, `py-8`) on viewports `< 768px`.
* **Viewport Stability:** Never use `h-screen` for full-height sections; always use `min-h-[100dvh]` to prevent Safari layout jumping.
* **Touch Targets:** All interactive elements must maintain a minimum tap target of `44px`.

## 6. Motion & Interaction (Bento 2.0 Engine)
* **Spring Physics:** Custom spring curve `type: "spring", stiffness: 100, damping: 20` for all interactive elements. No linear transitions.
* **Waterfall Reveals:** Feed list items mount sequentially using staggered entry delays (30ms increments).
* **Perpetual Micro-Interactions:** Active map markers and loading indicators use a continuous scale pulse loop (`scale-105` to `scale-95` over 2s).
* **Hardware Acceleration:** Animations restricted to `transform` and `opacity` properties. No transition mapping to `width`, `height`, or offsets.

## 7. Anti-Patterns (Banned AI Tells)
* **No Emojis:** Strictly banned in copywriting, tooltips, and labels. Use crisp SVG vector shapes.
* **No Inter Font:** Prohibited as display or body font.
* **No AI Copywriting Clichés:** Avoid words like "seamless", "next-gen", "unleash", "elevate", "revolutionize". Use concrete action verbs.
* **No Pure Black Backgrounds:** Base canvas must use `#0B0C0E`.
* **No Generic Placeholders:** Avoid names like "John Doe" or "Acme". Use realistic municipal names.
* **No 3-Column Card Grids:** Banned horizontally. Use asymmetrical grids or vertical streams.
