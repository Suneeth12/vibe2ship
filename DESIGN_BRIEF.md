# Design Brief: Community Hero

This document contains the structured I-Lang design brief mapping for the Community Hero platform.

## 1. I-Lang Structured Brief
```
[PLAN:@DESIGN|type=dashboard]
  |palette=monochrome_dark|accent=emerald
  |typography=satoshi|display=cabinet_grotesk
  |layout=asymmetric|max_width=1400px
  |mood=professional_minimal
  |density=compact|section_gap=24px
  |hero=split_map_and_feed
  |sections=map,issue_feed,incident_detail,metrics_bento
  |exclude=emojis,inter,gradients,neon_shadows
  |responsive=mobile_first
```

## 2. Dimension Resolution & Tokens
* **palette = monochrome_dark:**
  * Background: `#0B0C0E` (Canvas Ink)
  * Surface: `#16181C` (Surface Gray)
  * Text primary: `#F4F4F5`
  * Text secondary: `#A1A1AA`
  * Borders: `rgba(255, 255, 255, 0.06)` (Whisper Line)
* **accent = emerald:**
  * Accent: `#0D9488` (Civic Emerald)
  * Accent Active: `#0F766E`
* **typography = satoshi:**
  * Body & UI: Satoshi, 400, 1rem/1.5
* **display = cabinet_grotesk:**
  * Headings: Cabinet Grotesk, 700, tracking-tighter
* **density = compact:**
  * Feed padding: 16px
  * Panel gaps: 24px
* **layout = asymmetric:**
  * Desktop: 55/45 split viewport layout
  * Dashboard: Bento grid layout
* **exclude = emojis, inter, gradients, neon_shadows:**
  * Systemic restrictions enforced in the design spec.
