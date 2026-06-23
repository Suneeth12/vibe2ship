# Technology Stack & Environment Configuration

This document specifies the exact versions, packages, and environment configurations required for **Community Hero**.

---

## 1. Package Specifications & Versions

### Frontend Stack (`/client`)
* **Core Framework:** React (v18.3.1) + TypeScript (v5.4.5) + Vite (v5.2.11)
* **Routing:** React Router DOM (v6.23.1)
* **Map Rendering:** Leaflet (v1.9.4) & React Leaflet (v4.2.1)
* **Icons:** `@phosphor-icons/react` (v2.1.5)
* **HTTP Client:** Axios (v1.7.2)

### Backend Stack (`/server`)
* **Core Framework:** Express (v4.19.2) + Node.js (v20.x or higher)
* **AI Orchestration:** `@google/genai` (v0.1.1) (Google Gen AI SDK for Gemini API)
* **Firebase Admin:** `firebase-admin` (v12.1.1) (Firestore, Storage, and Auth management)
* **Middlewares:** `cors` (v2.8.5), `dotenv` (v16.4.5), `helmet` (v7.1.0)
* **Development Tools:** `nodemon` (v3.1.2) for hot-reloads

---

## 2. Required API Keys & Credentials
To run the platform locally or deploy to production, the following credentials must be set.

### Backend Environment Variables (`/server/.env`)
Create a `.env` file in the `/server` directory:

```env
# Server Port
PORT=5000

# Google AI Studio API Key (for Gemini 1.5 Flash/Pro)
GEMINI_API_KEY=AIzaSy...

# Firebase Service Account Credentials (encoded as single-line JSON)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"community-hero-...",...}'

# Google Maps API Key (Server-side usage for Geocoding & Places API, IP restricted)
GOOGLE_MAPS_SERVER_KEY=AIzaSy...
```

### Frontend Environment Variables (`/client/.env`)
Create a `.env` file in the `/client` directory:

```env
# Backend Base API Endpoint URL
VITE_API_URL=http://localhost:5000/api

# Google Maps API Key (Client-side usage for Maps JS SDK display, HTTP referrer restricted)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## 3. How to Obtain These Keys

### A. Google AI Studio API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key** in the top left.
3. Select your project or create a new one, then click **Create API Key**.

### B. Firebase Credentials & Service Account
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `Community Hero`.
3. Enable **Firestore Database**, **Firebase Authentication** (Email/Password & Google OAuth), and **Firebase Storage**.
4. Go to **Project Settings** (gear icon) → **Service Accounts**.
5. Click **Generate New Private Key** to download the JSON credentials file.

### C. Google Maps API Keys
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the following three APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
3. Go to **APIs & Services** → **Credentials** and click **Create Credentials** → **API Key**.
4. Restrict the key using HTTP Referrers in production.
