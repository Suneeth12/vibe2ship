# Technical Specifications: Key Features

This document provides a deep-dive technical specification for the core features of the **Community Hero** platform, highlighting the hackathon-winning innovations.

---

## 1. Multimodal AI Intake (Gemini Vision)
* **API Integration:** Leverages the Gemini 1.5 Flash API via the Google Gen AI SDK.
* **Process Flow:**
  1. Frontend captures or accepts upload of an image or short video (max 20MB, max 15 seconds).
  2. Frontend compresses the media on the client-side using HTML5 Canvas API (downscale to max 1200px width/height) or clips the video framerate to 2fps before streaming to reduce token payload.
  3. Media is uploaded to Firebase Storage, generating a secure signed URL.
  4. Backend makes a server-to-server call to the Gemini API, passing the image/video bytes along with structural prompt instructions.
* **Output Schema:** Gemini returns a structured JSON payload containing:
  - `isValidIssue` (boolean)
  - `issueType` (string enum: Pothole, Water Leak, Streetlight, Waste, Sidewalk Damage, Other)
  - `severityLevel` (enum: LOW, MEDIUM, HIGH, CRITICAL)
  - `visualEvidenceSummary` (string description of the visible damage)
  - `rejectionReason` (string, populated if `isValidIssue` is false)

---

## 2. The 6-Agent Pipeline Mechanics
To showcase high **Agentic Depth (20%)**, the backend orchestrates a pipeline of focused agents. To stay within rate limits (Gemini Free Tier: 15 RPM), the agents are executed sequentially as helper modules. They are unified under a single structural session call but log independent step statuses.

```
Incoming Report → [Triage Agent] → [Categorization Agent] → [Geospatial Agent] 
                   ↓ (valid?)
                 [Trust Agent] → [Prediction Agent] → [Resolution & Dispatch Agent]
```

### Agent Prompt Contracts & Jobs:
1. **Triage Agent:**
   - *Job:* Filter out spam, inappropriate content, dark screens, or images/videos with no visible municipal infrastructure.
   - *Prompt:* "Analyze the input media. Is this a valid public infrastructure or environmental issue? Answer true or false. If false, categorize the reason (spam, unsafe, private property, blank/poor quality)."
2. **Categorization Agent:**
   - *Job:* Categorize the issue, estimate repair complexity, and gauge community safety risk.
   - *Prompt:* "Identify the category of infrastructure failure. Estimate severity from LOW (aesthetic damage) to CRITICAL (immediate public safety threat, e.g., exposed high-voltage wiring, flooding)."
3. **Geospatial & Routing Agent:**
   - *Job:* Map coordinates to local municipal departments.
   - *Prompt:* Input: Coordinates + Address from Geocoding API. Map to: Public Works (Potholes/Sidewalks), Water & Sanitation (Leaks/Waste), Transport & Energy (Streetlights).
4. **Trust & Verification Agent:**
   - *Job:* Analyze reporter's history. Assign initial validation score.
   - *Trust Algorithm:*
     $$\text{Trust Score} = 50 + (\text{Resolved Reports} \times 5) - (\text{Spam Reports} \times 15)$$
     Score is capped between 0 and 100. Initial reports start with Trust Score = 50.
5. **Predictive Analytics Agent:**
   - *Job:* Analyze geographical clusters.
   - *Logic:* Checks Firestore for existing active issues within a 50-meter radius. If matches are found, it labels the new report as a "Potential Duplicate" and links them, grouping votes. It flags high-frequency grids (hotspots) for preventative maintenance alerts.
6. **Resolution & Dispatch Agent:**
   - *Job:* Draft formal work order payloads.
   - *Prompt:* "Generate a formal markdown work order summary. Detail: Issue type, location, severity, and step-by-step resolution requirements."

---

## 3. Geospatial & Maps Integration
* **Visual Map Interface:** Leaflet.js with Google Maps tile layers for high-performance responsive mapping.
* **Map Markers:** Customized SVG pins indicating issue type and status:
  - Red = Critical/Unresolved
  - Orange = Medium/Verified
  - Green = Resolved
* **Places Autocomplete:** Users can search addresses via the Google Places Autocomplete API to quickly center the map.
* **Geocoding API:** Resolves user coordinates (lat/lng) to physical street addresses for readable issue logs.

---

## 4. Crowdsourced Consensus & Trust System
* **Consensus Engine:**
  - Active citizens view reported issues in their proximity.
  - Votes: `Confirm` (adds +1 verification weight) vs `Spam` (adds -1 verification weight).
  - Weight is multiplied by the validator's Trust Score:
    $$\text{Vote Weight} = \frac{\text{Validator Trust Score}}{100}$$
  - Verification Threshold: An issue transitions from `Pending` to `Community Verified` when:
    $$\sum (\text{Vote Weight}) \ge 3.0$$
* **Sybil Attack Protections:**
  - Users can only validate issues located within 500 meters of their registered coordinate or verified GPS location.
  - Limits validation to one vote per user per issue.
  - Firestore rules enforce composite document keys (`issueId_userId`) to prevent duplicate submissions.

---

## 5. Gamification Mechanics
* **Civic Point Allocation:**
  - Report Approved: +10 pts
  - Valid Verification (voting with consensus): +5 pts
  - Issue Resolved (confirmed by city/reporter): +20 pts
* **Level & Badge Progression:**
  - Level 1 (Civic Novice): 0-100 pts
  - Level 2 (Neighborhood Watch): 101-500 pts
  - Level 3 (City Guardian): 501+ pts
* **Leaderboards:** Real-time query aggregates points grouped by User IDs for the weekly neighborhood leaderboard, driving community competition.

---

## 6. Predictive Hotspot Analysis
* **Cluster Mapping:** Evaluates coordinate clusters using a spatial boundary algorithm.
* **Hotspot Indicators:** Highlighting areas on the map using semi-transparent red circles (heatmaps) where reports exceed 5 incidents per week.
* **Predictive Alerts:** If water leak reports spike within a 100m grid over 24 hours, the system raises a predictive alert: "Possible Water Main Break detected in Sector B."
