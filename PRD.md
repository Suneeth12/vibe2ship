# Product Requirements Document (PRD): Community Hero

## 1. Executive Summary & Problem Context
* **Project Name:** Community Hero
* **Problem Statement:** Hyperlocal Problem Solver. Communities frequently face infrastructure and environmental issues (potholes, water leakages, damaged streetlights, waste accumulation). Existing reporting channels are fragmented, slow, opaque, and lack citizen engagement.
* **Core Solution:** A web application combining Google AI Studio (Gemini 1.5 Flash/Pro), Google Maps Platform, and Firebase. Citizens report issues via image or video, an autonomous multi-agent pipeline categorizes and routes them, community verification establishes trust, and gamification incentivizes participation.

## 2. Target Audience & Personas
* **Citizen Report (The Active Resident):** Wants to report issues quickly on mobile, track their status transparently, and see real community impact.
* **Citizen Validator (The Checker):** Validates reports submitted by others in their neighborhood to ensure accuracy and prevent spam.
* **City Administrator / Operator:** Needs a unified, auto-prioritized dashboard to manage, assign, and mark issues as resolved.

## 3. Product Scope & Functional Requirements

### 3.1. Issue Reporting (Multimodal Intake)
* **Image/Video Upload:** Users upload photos or short video clips showing the issue.
* **EXIF Metadata Parsing:** Automatically extract geo-coordinates and timestamps if available, allowing users to override/adjust via an interactive map interface.
* **Description Input:** Short optional text for additional context.

### 3.2. Autonomous Multi-Agent Processing Pipeline
To maximize **Agentic Depth (20% weight)**, a 6-agent system processes each issue in a structured, sequential workflow:
1. **Triage Agent:** Screens uploads for appropriateness, safety, and validity. Rejects duplicate or junk submissions.
2. **Categorization Agent:** Uses Gemini Multimodal Vision to inspect the image/video, identify the type of issue (pothole, streetlight, etc.), and determine severity.
3. **Geospatial & Routing Agent:** Matches coordinates to specific municipal zones or departments using Google Maps Geocoding & Places APIs.
4. **Trust & Verification Agent:** Calculates initial credibility score based on user history, upload EXIF metadata consistency, and duplicates.
5. **Predictive Analytics Agent:** Compares incoming report with historical data to flag recurring issues, forecast hotspots, or suggest systemic failures (e.g., water main breaks).
6. **Resolution & Dispatch Agent:** Drafts actionable task summaries and dispatches notification pay-loads to relevant services.

### 3.3. Community Verification (Consensus Mechanism)
* **Crowdsourced Validation:** Nearby users view reports on their map and vote "Confirm" or "Spam".
* **Consensus Threshold:** An issue is marked as "Community Verified" once it receives a net score of `+3` validations from distinct users.
* **Trust Score Adjustment:** Valid submissions increase the reporter's trust rating; spam reports decrease it.

### 3.4. Interactive Map & Live Tracking
* **Geospatial Interface:** Map displaying active, pending, verified, and resolved issues using color-coded pins.
* **Live Status Timeline:** Step-by-step progress tracking (Submitted → Verified → Dispatched → In Progress → Resolved) showing timestamps and agent notes.

### 3.5. Gamification & Engagement
* **Points System:** Citizens earn points for reporting (10 pts), validating (5 pts), and when their reported issue is resolved (20 pts).
* **Civic Badges:** Unlock badges like "Pothole Patrol", "Lighting Inspector", or "Neighborhood Guard".
* **Leaderboard:** Weekly/monthly leaderboard showing top community contributors.

## 4. Technical Constraints & Google Tech Stack
* **Core LLM & Deployment:** Google AI Studio (Gemini 1.5 Flash for fast/low-cost triage, Gemini 1.5 Pro for deep predictive analysis). Deployed on Cloud Run Starter Tier.
* **Frontend:** React + Vite + TypeScript. Styled with Vanilla CSS (Glassmorphism, Outfit/Satoshi fonts, dark canvas).
* **Backend:** Node.js + Express.js.
* **Database & Storage:** Firebase Firestore (document store) & Firebase Storage (images/videos).
* **Mapping:** Google Maps JavaScript API, Places API, Geocoding API.
* **Authentication:** Firebase Auth (Email/Password, Google Sign-in).
