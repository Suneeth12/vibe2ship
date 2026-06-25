# STRIDE Threat Model: Community Hero

## Component Inventory

| # | Component | Trust Boundary | Entry Points |
|---|-----------|---------------|-------------|
| C1 | React Client (Browser) | Untrusted | User input, camera, GPS, URL params |
| C2 | Express API (Cloud Run) | Semi-trusted | HTTP endpoints, Firebase Admin SDK |
| C3 | Gemini API (Google) | Trusted | Server-to-server API calls |
| C4 | Cloud Firestore | Trusted | Admin SDK writes, client SDK reads |
| C5 | Firebase Storage | Semi-trusted | Authenticated uploads, public reads |
| C6 | Firebase Auth | Trusted | ID token issuance, verification |
| C7 | Google Maps Platform | Trusted | Client-side JS SDK, server-side Geocoding |

---

## STRIDE Analysis Per Component

### C1: React Client (Browser)

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Spoofing** | Forged GPS coordinates submitted with report | 3 | 4 | HIGH | Server-side: cross-validate GPS with EXIF metadata. Flag discrepancies >100m. IP-based geolocation sanity check |
| **Tampering** | Modified API requests via DevTools (change reporterId, severity, category) | 4 | 3 | HIGH | Server ignores client-supplied reporterId; derives from Firebase Auth token. AI pipeline sets category/severity, not client |
| **Repudiation** | User denies submitting a report | 2 | 2 | LOW | Firebase Auth UID attached to every document. Audit log records creation timestamp + UID |
| **Info Disclosure** | API keys visible in frontend source | 5 | 3 | CRITICAL | Maps JS key restricted to HTTP referrers. Gemini key server-only. No secrets in client bundle |
| **Info Disclosure** | Other users' email/private data exposed via Firestore reads | 3 | 3 | HIGH | Firestore `users` collection: expose only `displayName`, `points`, `level`, `trustScore`. Email field excluded from client-readable projection |
| **DoS** | Rapid-fire report submissions overwhelming Gemini API | 4 | 3 | HIGH | Per-user rate limit: 10 reports/hour. Per-IP rate limit: 20/hour. Frontend debounce on submit button |
| **Elevation** | Modify client JS to call admin-only endpoints | 4 | 2 | MEDIUM | No admin endpoints exposed. All writes via authenticated Express routes with token verification |

### C2: Express API (Cloud Run)

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Spoofing** | Forged Firebase Auth ID tokens | 5 | 1 | MEDIUM | `firebase-admin` `verifyIdToken()` validates token signature, expiry, issuer. Tokens signed by Google's private key |
| **Tampering** | SQL/NoSQL injection via issue description or address fields | 4 | 2 | HIGH | Firestore SDK uses parameterized document operations (no raw query strings). Input sanitized: description max 1000 chars, address max 200 chars |
| **Tampering** | Malicious image upload (SVG with JS, polyglot file) | 4 | 3 | HIGH | Accept only `image/jpeg`, `image/png`, `image/webp`. Validate MIME via magic bytes (not extension). Strip EXIF GPS from stored copy |
| **Repudiation** | No audit trail for status changes | 3 | 2 | MEDIUM | `log_event()` writes to `audit_log` Firestore collection on every status transition |
| **Info Disclosure** | Stack traces in production error responses | 3 | 3 | HIGH | Express error handler returns generic `{ error: "Internal server error" }`. Full stack logged server-side only |
| **Info Disclosure** | Gemini API key leaked in error responses | 5 | 2 | CRITICAL | Error handler strips any string matching `AIza*` pattern before returning response |
| **DoS** | Large payload body (>50MB) crashes server | 3 | 3 | HIGH | Express `body-parser` limit: `{ limit: '10mb' }`. Cloud Run request timeout: 300s |
| **DoS** | Gemini API rate limit exhaustion (15 RPM free tier) | 4 | 4 | HIGH | Consolidate 6 agents into 2-3 API calls. Cache identical image analysis results (dHash key). Queue overflow requests with retry |
| **Elevation** | User modifies another user's issue status | 4 | 2 | HIGH | Status updates restricted: only reporter can update description. Only system can change status via agent pipeline. Votes create separate documents |

### C3: Gemini API (Google)

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Tampering** | Prompt injection via image metadata or description text | 3 | 3 | HIGH | System prompt is hardcoded server-side. User text appended as `user` role, never inside system prompt. Structured JSON output mode prevents free-text responses |
| **Info Disclosure** | Sensitive location data sent to Gemini | 2 | 2 | LOW | Only image bytes + anonymized description sent. No PII (email, name, phone) included in prompt |
| **DoS** | Cost explosion from recursive agent loops | 5 | 2 | HIGH | Hard cap: max 3 Gemini API calls per report. Total daily budget cap enforced in middleware |

### C4: Cloud Firestore

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Spoofing** | Client impersonates another user's write | 5 | 1 | LOW | `allow write: if false` — all client writes blocked. Admin SDK only |
| **Tampering** | Direct Firestore manipulation via REST API | 5 | 1 | LOW | Security rules block all client writes. Admin SDK requires service account key |
| **Info Disclosure** | `allow read: if true` exposes all documents | 3 | 4 | MEDIUM | Acceptable: issues, leaderboard, and verification data are public by design. User email excluded from `users` documents visible to client |
| **DoS** | Read-heavy abuse via `onSnapshot` listeners | 3 | 3 | MEDIUM | Firestore auto-scales reads. Cloud Run budget caps prevent cost explosion. Client limits snapshot listeners to visible viewport |

### C5: Firebase Storage

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Tampering** | Upload non-image file disguised as image | 4 | 3 | HIGH | Storage rules enforce `contentType.matches('image/.*|video/.*')`. Server-side magic byte validation as second check |
| **DoS** | Upload massive files to exhaust storage quota | 3 | 3 | HIGH | Storage rules enforce `size < 20MB`. Client-side pre-compression to 1200px max dimension |
| **Info Disclosure** | EXIF GPS data in uploaded images reveals reporter's home | 3 | 3 | MEDIUM | Server strips EXIF data after extraction. Stored image has no GPS metadata |

### C6: Firebase Auth

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Spoofing** | Brute-force login attempts | 3 | 3 | MEDIUM | Firebase Auth has built-in brute-force protection (automatic lockout after repeated failures) |
| **Spoofing** | Email enumeration via sign-up/reset flows | 2 | 3 | MEDIUM | Firebase Auth setting: enable email enumeration protection in Firebase Console |
| **Elevation** | Anonymous auth bypasses trust system | 3 | 2 | MEDIUM | Anonymous auth disabled. Only Email/Password and Google OAuth enabled |

### C7: Google Maps Platform

| Threat | Vector | Impact | Prob | Sev | Mitigation |
|--------|--------|--------|------|-----|------------|
| **Info Disclosure** | Client Maps API key stolen and used on other domains | 3 | 4 | HIGH | Key restricted to HTTP referrers (Cloud Run domain + localhost). API restricted to Maps JS, Geocoding, Places only |
| **DoS** | Key abuse causing billing spike | 4 | 3 | HIGH | Daily quota caps: 1000 map loads/day, 500 geocode calls/day |

---

## Risk Matrix Summary

| Severity | Count | Action Required |
|----------|-------|----------------|
| CRITICAL | 2 | Must fix before submission |
| HIGH | 14 | Fix during development |
| MEDIUM | 8 | Address if time permits |
| LOW | 3 | Accept risk |

---

## Top 5 Risks (Ordered by Severity x Probability)

1. **Gemini API rate limit exhaustion during judging** (Sev=HIGH, Prob=HIGH) → Consolidate agents, cache, queue
2. **Forged GPS coordinates in reports** (Sev=HIGH, Prob=HIGH) → Cross-validate EXIF + IP geolocation
3. **Malicious image upload** (Sev=HIGH, Prob=HIGH) → Magic byte validation + MIME check + size limit
4. **Maps API key abuse** (Sev=HIGH, Prob=HIGH) → HTTP referrer restriction + daily quota
5. **Prompt injection via issue description** (Sev=HIGH, Prob=MEDIUM) → Hardcoded system prompt + structured JSON output

---

## PASTA Business Impact Analysis

### Stage 1: Business Objectives
- Platform must remain operational and responsive during hackathon judging (5-minute window per submission)
- Reporter trust and data integrity are paramount for community adoption
- Cost must stay within free tier / starter tier limits

### Stage 2: Technical Scope
- React frontend, Express API, Gemini AI, Firestore, Firebase Storage, Firebase Auth, Google Maps

### Stage 3: Application Decomposition
- Trust boundaries: Browser ↔ Cloud Run, Cloud Run ↔ Google APIs, Cloud Run ↔ Firebase
- Data flows: Image upload → Storage → Gemini analysis → Firestore persistence → Client read

### Stage 4: Threat Analysis
- Primary threats: API abuse, data integrity manipulation, cost explosion, key exposure

### Stage 5: Vulnerability Analysis
- Weakest link: Gemini rate limits (15 RPM free tier) under concurrent judge access
- Second: Client-side GPS can be trivially spoofed

### Stage 6: Attack Modeling
- Attack tree: Judge opens app → submits 5 reports in 1 minute → Gemini rate limit hit → app appears broken → score = 0
- Prevention: Agent consolidation (2-3 calls, not 6) + request queuing + graceful degradation UI

### Stage 7: Risk & Impact Analysis
- Residual risk after mitigations: LOW. All CRITICAL issues have documented fixes. Rate limit risk managed by agent consolidation and caching.
