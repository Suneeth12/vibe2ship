# System Workflows & Verification Checklist

This document details the user journeys, issue processing flow, and testing procedures for the **Community Hero** platform.

---

## 1. User Journeys

### A. The Reporter's Journey (Submitting a Report)
1. **Intake:** User opens the web app on their phone, clicks "Report Issue", and uploads a photo or video showing a pothole.
2. **Location Resolve:** The system extracts EXIF GPS tags. If missing, it uses the browser Geolocation API to fetch coordinates, showing the user a map pin they can adjust.
3. **Pipeline Action:** User clicks "Submit". The file uploads to Firebase Storage, and the backend routes the issue to the 6-agent AI processing pipeline.
4. **Instant Output:** The user is redirecting to the Live Status screen, showing the issue is in "Submitted" state, with the triage and category details updating in real-time.

### B. The Validator's Journey (Verifying a Report)
1. **Discovery:** A resident opens the interactive map and views pending issues within a 500-meter radius of their current location.
2. **Review:** The validator selects a pin (e.g., "Water Leakage"), views the uploaded photo, and sees the category, severity, and geocoded address.
3. **Consensus Voting:** The validator clicks "Confirm" (looks correct) or "Spam" (fake, duplicate, or resolved).
4. **Outcome:** The database records the vote using a composite document ID to block duplicate voting, updates the issue verification count, and recalculates the trust consensus score.

---

## 2. Issue Processing Flow (Backend Route)
When the endpoint `POST /api/issues/create` is triggered:

```
[Incoming Request]
       │
       ▼
[Validate Auth Token] ──────────► (Auth fails → 401 Unauthorized)
       │
       ▼
[Verify Coordinates & Media] ───► (Data invalid → 400 Bad Request)
       │
       ▼
[Execute Triage Agent] ─────────► (Image inappropriate/irrelevant → Status = Rejected)
       │
       ▼
[Execute Categorization Agent] ──► (Detect category, severity, visual summary)
       │
       ▼
[Execute Geospatial Agent] ────► (Geocode coordinates to address, resolve department)
       │
       ▼
[Execute Trust Agent] ──────────► (Compute initial trust score from reporter history)
       │
       ▼
[Execute Prediction Agent] ─────► (Cluster coordinates, link duplicates)
       │
       ▼
[Execute Dispatch Agent] ───────► (Generate markdown work order summary)
       │
       ▼
[Write Firestore Documents]
```

---

## 3. Verification & Testing Checkpoints

To ensure the platform is robust, secure, and ready to win the hackathon, we apply this verification plan:

### 3.1. Security Checkpoints (Mandatory)
* [ ] **Auth Token Check:** Verify that endpoints `/api/issues/create` and `/api/verifications/vote` refuse requests with invalid or missing Firebase Auth ID tokens.
* [ ] **Maps Key Restrictions:** Confirm Google Cloud Console credential settings restrict the Maps API key to HTTP Referrers matching only the local development origins and the Cloud Run production origin.
* [ ] **Firestore Rules Test:** Attempt to write to `issues` from the frontend using a different reporter ID. The write should fail. Verify that updates to `issues` are restricted only to `votes`, `verificationCount`, and `status`.

### 3.2. Multimodal AI Verification
* [ ] **Triage Test (Positive):** Upload a clear photo of a pothole. Verify the Triage Agent passes the image and the Categorization Agent classifies it as "Pothole".
* [ ] **Triage Test (Negative):** Upload a selfie, food photo, or a blank black image. Verify the Triage Agent rejects the image and sets status to "Rejected".
* [ ] **Video Test:** Upload a 5-second video of running water on a street. Verify the agent classifies it as "Water Leakage".

### 3.3. Crowdsourcing Consensus Verification
* [ ] **Consensus Transition:** Create an issue with initial status `Pending`. Have three different test users vote "Confirm" on it. Verify the status updates automatically to `Community Verified` in Firestore.
* [ ] **Sybil Prevention:** Attempt to vote twice from the same user ID on a single issue. The database must reject the duplicate vote document write.
* [ ] **Geofence Check:** Attempt to vote on an issue located 10 kilometers away from the user's current coordinates. Verify the backend blocks the vote.

### 3.4. Observability & Logging Checkpoints
* [ ] **Logging Verification:** Ensure `logging.getLogger` initializes correctly and `logger.info` outputs structured logs for every issue creation.
* [ ] **Audit Trail Check:** Verify `log_event` successfully writes audit logs to Firestore when status changes.
* [ ] **Alerting Test:** Trigger a database exception manually and verify that the `sentry_sdk` captures the error and forwards it to Sentry dashboard.
