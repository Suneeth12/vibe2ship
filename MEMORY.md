# Vibe2Ship Hackathon — Project Memory

## 1. Active Goal
- Scaffold client (React/Vite) and server (Express) codebases, then implement core features.
- All specification docs are complete and security-hardened. Ready for implementation.

## 2. Key Decisions
- **Problem Statement:** PS2 — Community Hero: Hyperlocal Problem Solver.
- **Backend Architecture:** Express.js + firebase-admin SDK. Admin-SDK-only writes (AUTHORITATIVE). No client writes to Firestore.
- **Frontend Architecture:** React (Vite) + Leaflet.js + Cabinet Grotesk/Satoshi typography + DOMPurify for XSS.
- **Firestore Security:** Per-collection rules. Public: issues, users, verifications, leaderboard (read-only). Internal: imageHashes, audit_log, predictions (blocked). All writes via server Admin SDK.
- **Storage Security:** Per-user scoped paths. Explicit MIME whitelist (no SVG). Images 5MB max, videos 20MB max.
- **Server Validation:** Zod schemas on every Express route. reporterId from auth token, never from body. Firestore transactions for counters.
- **User Roles:** reporter (default), validator, admin — stored as Firebase custom claims, set via Admin SDK only.
- **Maps API Restrictions:** Client key = HTTP referrer restricted. Server key = IP restricted. Both API-restricted to Maps JS, Geocoding, Places.
- **Image Pipeline:** Client Canvas re-encode strips EXIF → Firebase Storage upload → Server sharp re-process + magic byte validation.
- **Gemini Optimization:** 6 logical agents → 2-3 actual API calls. Cache by dHash. Queue overflow.
- **Observability:** pino (structured JSON logging) + @sentry/node (error tracking) + Firestore audit_log collection.
- **Production Deploy:** Cloud Run Starter Tier. ADC (no service account JSON key). min-instances=1.

## 3. API Keys Required
- `GEMINI_API_KEY` — Google AI Studio auth key (server .env only)
- `FIREBASE_SERVICE_ACCOUNT` — Service account JSON (local dev only; use ADC on Cloud Run)
- `GOOGLE_MAPS_SERVER_KEY` — Server-side geocoding (IP restricted)
- `VITE_GOOGLE_MAPS_API_KEY` — Client-side maps display (HTTP referrer restricted)
- `SENTRY_DSN` — Error tracking endpoint (server .env)

## 4. Status & Milestones
- [x] Design specifications completed (PRD, FEATURES, ARCHITECTURE, WORKFLOW, DESIGN, TECH_STACK, VERIFICATION)
- [x] Deep security audit: 31 findings identified and resolved across Firebase, API, and Frontend domains
- [x] STRIDE + PASTA threat model completed (THREAT_MODEL.md) — 27+ vectors analyzed
- [x] Backend specification completed (BACKEND.md) — folder structure, API contracts, middleware stack
- [x] Frontend specification completed (FRONTEND.md) — component tree, security implementations, design tokens
- [x] All contradictions between implementation_plan.md and ARCHITECTURE.md resolved
- [x] Missing dependencies added to TECH_STACK.md (zod, express-rate-limit, sharp, pino, dompurify, piexifjs)
- [ ] Initialize client React scaffolding (Next Step)
- [ ] Initialize server Express scaffolding (Next Step)
- [ ] Implement core features (Phase 2-3)
- [ ] Deploy to Cloud Run (Phase 4)

## 5. File Index
| File | Purpose |
|------|---------|
| PRD.md | Product requirements + functional scope |
| FEATURES.md | Deep-dive technical specs for each feature |
| ARCHITECTURE.md | System architecture + database schema + security rules (AUTHORITATIVE) |
| BACKEND.md | Server folder structure + API contracts + middleware |
| FRONTEND.md | Client folder structure + security implementations + design tokens |
| DESIGN.md | Visual design system + component stylings |
| DESIGN_BRIEF.md | I-Lang structured design brief |
| TECH_STACK.md | Package versions + API key setup instructions |
| WORKFLOW.md | User journeys + processing flow + verification checkpoints |
| VERIFICATION.md | Hackathon evaluation criteria mapping + test plan |
| THREAT_MODEL.md | STRIDE + PASTA threat analysis (27+ vectors) |
| SECURITY_AUDIT.md | Consolidated audit report (31 findings, all resolved) |
| implementation_plan.md | Master timeline + premortem + agent optimization |
