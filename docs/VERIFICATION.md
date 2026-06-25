# Project Verification & Testing Plan

This document outlines the validation procedures, automated test scripts, and manual checkpoints designed to satisfy all evaluation criteria in the hackathon submission guidelines.

---

## 1. Automated Verification Checks

To run automated checks across the codebase, execute the following commands in the workspace root:

### Code Quality & Types Check
```bash
# Frontend Type Checking
cd client && npm run type-check

# Frontend & Backend Linting
cd .. && npm run lint
```

### Backend API Tests (Supertest)
```bash
# Run backend integration tests (validates endpoints, Auth tokens, CORS, and rate-limits)
cd server && npm run test
```

### Frontend End-to-End Tests (Playwright)
```bash
# Run end-to-end tests simulating full user flows (Report -> AI Triage -> Map pin -> Consensus vote)
cd client && npm run test:e2e
```

---

## 2. Hackathon Evaluation Criteria Mapping

This section outlines how each criterion of the **Evaluation Matrix** is verified.

### 2.1. Problem Solving & Impact (20% Weight)
* **Goal:** Verify that the solution successfully solves hyperlocal community problems and encourages transparency.
* **Checks:**
  - **Geofence Check:** Validate that a validation vote on an issue fails if coordinates are >500m from user location.
  - **Status Updates:** Verify that issues updated to `Resolved` send notifications and update the global analytics feed in Firestore.

### 2.2. Agentic Depth (20% Weight)
* **Goal:** Validate the multi-agent processing pipeline (Triage, Categorization, Routing, Trust, Prediction, Dispatch).
* **Checks:**
  - **Triage Validation (Bad Input):** Upload a blank image, an unrelated photo (e.g., food), or a document. Verify the Triage Agent flags it as `isValidIssue = false` and sets the status to `Rejected`.
  - **Categorization Validation:** Upload a clear image of a pothole. Verify the Categorization Agent outputs category `Pothole` and sets severity appropriately.
  - **Prediction Validation (Duplicate Check):** Submit two identical reports within 20 meters of each other. Verify the second report is flagged as a `Potential Duplicate` and linked to the first.

### 2.3. Innovation & Creativity (20% Weight)
* **Goal:** Validate the consensus mechanism and the gamification engine.
* **Checks:**
  - **Weighted Voting:** Submit votes from two users with trust scores of `80` and `40`. Verify the consensus score increments by `1.2` total (weighted `0.8` and `0.4` respectively).
  - **Transition to Verified:** Vote "Confirm" with three separate users (each with standard Trust Score = 100, consensus threshold of 1.5). Verify status changes from `Pending` to `Community Verified`.
  - **Leaderboard Points:** Verify that submitting a confirmed report adds `10` points to the user's document in Firestore and updates their ranking.

### 2.4. Google Technologies Utilized (15% Weight)
* **Goal:** Audit usage of Gemini, Google Maps, and Firebase.
* **Checks:**
  - **Gemini Key Isolation:** Verify that the backend server `.env` file holds the `GEMINI_API_KEY`, and no client-side source code references it. Check DevTools Network tab for any `AIza` pattern.
  - **Maps Key Restrictions:** Open the browser DevTools console, simulate requests from a non-approved domain, and verify the Google Maps API rejects the requests. Verify daily quota caps are set (1000 map loads, 500 geocode calls).
  - **Firebase Security Rules:** Run these checks against deployed Firestore:
    - Client SDK write to `issues` collection → MUST fail
    - Client SDK read from `imageHashes` collection → MUST fail
    - Client SDK read from `audit_log` collection → MUST fail
    - Client SDK read from `issues` collection → MUST succeed
  - **Storage Rules:** Attempt to upload SVG file → MUST fail. Attempt to upload to another user's path → MUST fail.
  - **Firebase Auth Config:** Verify anonymous auth is disabled. Verify email enumeration protection is enabled.

### 2.5. Security Hardening (Deep Audit Verification)
* **Goal:** Verify all 31 findings from the deep security audit are implemented.
* **Checks:**
  - **Zod Validation:** Send `POST /api/issues/create` with `{ latitude: 9999 }` → expect 400. Send with `description` of 5000 chars → expect 400.
  - **Rate Limiting:** Send 11 `POST /api/issues/create` in 1 hour from same user → 11th returns 429.
  - **CORS:** `curl -H 'Origin: https://evil.com' POST /api/issues/create` → no `Access-Control-Allow-Origin` header in response.
  - **EXIF Stripping:** Upload JPEG with GPS EXIF data → download stored image from Storage → verify no EXIF GPS metadata remains.
  - **XSS Prevention:** Set Firebase displayName to `<img src=x onerror=alert(1)>` → verify rendered as plain text in leaderboard.
  - **CSP Headers:** Check response headers for `Content-Security-Policy` containing `default-src 'self'`.
  - **Console Stripping:** View production bundle source → no `console.log` calls present.
  - **Source Maps:** Check production build output → no `.map` files generated.
  - **Error Handling:** Trigger 500 error → response body contains `{ "error": "Internal server error" }`, no stack trace.

### 2.6. Product Experience & Design (10% Weight)
* **Goal:** Audit visual premium looks, mobile responsiveness, and performance.
* **Checks:**
  - **Lighthouse Performance Audit:** Run a Google Lighthouse audit on the client dashboard. Ensure:
    - Performance Score ≥ 90%
    - Accessibility (a11y) Score ≥ 95%
    - Best Practices Score ≥ 90%
  - **Mobile Layout Audit:** Inspect the layout on a mobile screen size (375px width). Verify that the split map and feed layout collapses into a single vertical scroll stream with no horizontal overflow.

### 2.7. Technical Implementation & Completeness (15% Weight)
* **Goal:** Verify the application is fully functional, complete, and deployed on Cloud Run.
* **Checks:**
  - **Build Integrity:** Verify `npm run build` succeeds on both the client and server without warnings.
  - **E2E Integration:** Perform the complete user flow from reporting an issue with a camera upload to marking it resolved. Ensure all state changes persist in Firestore.
