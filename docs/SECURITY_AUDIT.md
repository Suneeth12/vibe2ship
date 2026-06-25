# Security Audit Report: Community Hero

**Target:** `D:\PROJECTS\HACKATONS\Vibe2Ship`
**Last Updated:** 2026-06-23T23:28:00+05:30
**Audit Phases:** Automated (007 Scanner) + Manual (STRIDE/PASTA) + Domain-Specific (Firebase, API, Frontend)

---

## Audit History

### Round 1: 007 Automated Scanner (2026-06-23T17:47Z)
- **Score:** 98.1/100 (PASS)
- **Scope:** 16 documentation files (0 source code files)
- **Limitation:** Scanned markdown only — no code existed yet. Score reflects doc hygiene, not app security.

### Round 2: Deep Security Audit (2026-06-23T17:50Z)
Three domain-specific subagent audits + manual STRIDE/PASTA threat model.

---

## Critical Findings Resolved

### CRITICAL-1: Firestore Rules Contradiction ✅ RESOLVED
- **Issue:** `implementation_plan.md` had granular client-write rules. `ARCHITECTURE.md` had Admin-SDK-only approach. These are architecturally incompatible.
- **Fix:** Unified on Admin-SDK-only (ARCHITECTURE.md Section 5 is authoritative). Deleted granular rules from implementation_plan.md. Added mandatory Zod validation requirement.

### CRITICAL-2: Zero Server-Side Validation ✅ RESOLVED
- **Issue:** Admin SDK bypasses ALL Firestore rules. No Zod/Joi schemas defined anywhere. Server could write anything to any collection.
- **Fix:** Added Zod validation requirement to ARCHITECTURE.md, BACKEND.md, WORKFLOW.md. Defined schemas for all endpoints in BACKEND.md Section 2.

### CRITICAL-3: CSP Headers Missing ✅ RESOLVED
- **Issue:** No Content-Security-Policy defined. App loads Google Maps, Firebase, Leaflet from external domains — default CSP would break the app; no CSP leaves XSS wide open.
- **Fix:** Full CSP configuration added to BACKEND.md Section 3 (Helmet config) with all required Google/Firebase/Leaflet origins.

### CRITICAL-4: XSS Prevention Incomplete ✅ RESOLVED
- **Issue:** User content, Firebase displayName, and Gemini AI output could all contain HTML. No DOMPurify dependency listed. No sanitization strategy.
- **Fix:** Added `dompurify` to TECH_STACK.md. Full sanitization API in FRONTEND.md Section 2.1. Rule: sanitize ALL user + AI text before render.

---

## HIGH Findings Resolved

| # | Finding | Fix Applied | Spec Updated |
|---|---------|------------|-------------|
| H-1 | Storage rules accept `image/svg+xml` (XSS via SVG) | Explicit MIME whitelist: `image/jpeg|image/png|image/webp` | ARCHITECTURE.md |
| H-2 | Storage not scoped per user (any user can overwrite others) | Path scoped: `/issues/{userId}/images/{fileName}` with `uid == userId` check | ARCHITECTURE.md |
| H-3 | No RBAC — no role field in user schema | Added `role` field (`reporter`/`validator`/`admin`) stored as Firebase custom claims | ARCHITECTURE.md |
| H-4 | Auth: anonymous auth, no App Check, no email verification | Added Firebase Console checklist: disable anon, enable email enum protection, add App Check | ARCHITECTURE.md §7 |
| H-5 | No rate limiting package in dependencies | Added `express-rate-limit` v7.2.0 to TECH_STACK.md | TECH_STACK.md |
| H-6 | No Zod package for input validation | Added `zod` v3.23.8 to TECH_STACK.md | TECH_STACK.md |
| H-7 | No image processing for EXIF stripping | Added `sharp` v0.33.4 to TECH_STACK.md | TECH_STACK.md |
| H-8 | EXIF GPS data exposed in public Storage uploads | Client-side Canvas re-encode strips EXIF. Server-side sharp re-processes. Both layers. | FRONTEND.md §2.4 |
| H-9 | Observability code used Python patterns (logging, sentry_sdk) | Fixed to Node.js: pino + @sentry/node | ARCHITECTURE.md §6, WORKFLOW.md |
| H-10 | Error handler could leak stack traces and API keys | Error handler strips `AIza*` patterns, returns generic messages in production | BACKEND.md §3 |
| H-11 | No error tracking package | Added `@sentry/node` v8.9.2 and `pino` v9.1.0 to TECH_STACK.md | TECH_STACK.md |
| H-12 | Cloud Storage CORS not configured | Added CORS JSON config to ARCHITECTURE.md §7 | ARCHITECTURE.md |
| H-13 | Open311 POST endpoint has no auth | Documented: requires API key auth or rate-limited with CAPTCHA | BACKEND.md §2 |
| H-14 | Global `read: if true` exposes internal collections | Per-collection rules: `imageHashes`, `audit_log`, `predictions` = `read: if false` | ARCHITECTURE.md §5 |

---

## MEDIUM Findings Resolved

| # | Finding | Fix Applied |
|---|---------|------------|
| M-1 | Service account JSON in .env (leak risk) | Production: use ADC on Cloud Run, no key file. Added to ARCHITECTURE.md §7 |
| M-2 | No client-side upload validation | Full validation with magic bytes in FRONTEND.md §2.3 |
| M-3 | No open redirect protection | URL allowlist + safeRedirect() in FRONTEND.md §2.2 |
| M-4 | Console.log in production builds | Vite terser config: `drop_console: true` in FRONTEND.md §3 |
| M-5 | Source maps expose source code | `sourcemap: false` in production Vite config in FRONTEND.md §3 |
| M-6 | No offline draft TTL / cleanup | 7-day TTL + auto-purge in FRONTEND.md §2.5 |
| M-7 | No Firestore transaction for counter updates | Documented in ARCHITECTURE.md §5 server-side validation |
| M-8 | No idempotency for issue creation | Dedup key: hash(reporterId + coords + timestamp_minute) documented in BACKEND.md |
| M-9 | Clickjacking not blocked | `frameguard: { action: 'deny' }` in Helmet config, BACKEND.md §3 |
| M-10 | No SRI for CDN scripts | Self-host fonts. Leaflet SRI hash documented in FRONTEND.md §1 |

---

## STRIDE Threat Model

Full STRIDE analysis covering all 7 system components with 27+ threat vectors is documented in [THREAT_MODEL.md](file:///d:/PROJECTS/HACKATONS/Vibe2Ship/THREAT_MODEL.md).

**Top 5 Risks (post-mitigation):**
1. Gemini API rate limit exhaustion → Mitigated by agent consolidation (2-3 calls, not 6) + caching
2. GPS coordinate spoofing → Mitigated by EXIF cross-validation + server-side sanity check
3. Malicious image upload → Mitigated by explicit MIME whitelist + magic byte validation + EXIF strip
4. Maps API key abuse → Mitigated by HTTP referrer restriction + daily quota caps
5. Prompt injection via description → Mitigated by hardcoded system prompt + structured JSON output mode

---

## Current Status

| Category | Findings | Resolved | Open |
|----------|---------|----------|------|
| CRITICAL | 4 | 4 | 0 |
| HIGH | 14 | 14 | 0 |
| MEDIUM | 10 | 10 | 0 |
| LOW | 3 | 3 | 0 |
| **Total** | **31** | **31** | **0** |

**Verdict: ALL findings resolved in specifications. Implementation must follow specs exactly.**

---

*Generated by manual STRIDE/PASTA analysis + Firebase/API/Frontend domain-specific skill audits*
