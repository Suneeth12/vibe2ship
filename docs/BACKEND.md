# Backend Specification: Community Hero

## 1. Server Architecture

```
/server
├── src/
│   ├── index.ts                  # Express app entry point
│   ├── config/
│   │   ├── firebase.ts           # Firebase Admin SDK initialization
│   │   ├── gemini.ts             # Google Gen AI SDK initialization
│   │   └── env.ts                # Environment variable validation
│   ├── middleware/
│   │   ├── auth.ts               # Firebase Auth token verification
│   │   ├── rateLimiter.ts        # Per-user + per-IP rate limiting
│   │   ├── validation.ts         # Request body schema validation
│   │   ├── errorHandler.ts       # Global error handler (no stack traces)
│   │   └── security.ts           # Helmet, CORS, CSP headers
│   ├── routes/
│   │   ├── issues.ts             # POST /create, GET /list, GET /:id
│   │   ├── verifications.ts      # POST /vote, GET /status
│   │   ├── users.ts              # GET /profile, GET /leaderboard
│   │   ├── open311.ts            # GET /services, POST /requests
│   │   └── health.ts             # GET /health (unauthenticated)
│   ├── agents/
│   │   ├── pipeline.ts           # Orchestrator: calls mega-analyzer + router
│   │   ├── megaAnalyzer.ts       # Gemini Call #1: Triage + Categorize + Priority
│   │   ├── routerVerifier.ts     # Gemini Call #2: Route + Deduplicate
│   │   ├── predictor.ts          # Gemini Call #3: Async trend analysis
│   │   └── prompts.ts            # System prompt templates (hardcoded)
│   ├── services/
│   │   ├── firestore.ts          # Firestore CRUD operations
│   │   ├── storage.ts            # Firebase Storage upload/URL generation
│   │   ├── geocoding.ts          # Google Maps Geocoding API wrapper
│   │   ├── imageHash.ts          # dHash computation + Hamming distance
│   │   ├── exifParser.ts         # EXIF metadata extraction + GPS stripping
│   │   └── consensus.ts          # Weighted voting + threshold calculation
│   └── utils/
│       ├── logger.ts             # Structured logging (Winston/Pino)
│       ├── auditLog.ts           # Firestore audit trail writer
│       └── sanitize.ts           # Input sanitization (DOMPurify server)
├── package.json
├── tsconfig.json
├── .env                          # (gitignored) API keys
└── Dockerfile                    # Cloud Run deployment
```

---

## 2. API Endpoint Contracts

### Authentication
All endpoints except `GET /health` and `GET /api/open311/*` require a valid Firebase Auth ID token in the `Authorization: Bearer <token>` header.

### POST /api/issues/create

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| mediaUrl | string | Firebase Storage URL pattern match | Yes |
| mediaType | string | Enum: `image/jpeg`, `image/png`, `image/webp`, `video/mp4` | Yes |
| description | string | Max 1000 chars, sanitized | No |
| latitude | number | Range: -90 to 90 | Yes |
| longitude | number | Range: -180 to 180 | Yes |

**Response (201):**
```json
{
  "issueId": "abc123",
  "status": "Submitted",
  "agentResults": {
    "triage": { "isValid": true },
    "category": "Pothole",
    "severity": "HIGH",
    "department": "Public Works",
    "confidence": 0.94,
    "isDuplicate": false
  }
}
```

### POST /api/verifications/vote

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| issueId | string | Must exist in Firestore | Yes |
| vote | string | Enum: `Confirm`, `Spam` | Yes |
| latitude | number | Must be within 500m of issue | Yes |
| longitude | number | Must be within 500m of issue | Yes |

**Response (201):**
```json
{
  "voteRecorded": true,
  "newConsensusScore": 2.4,
  "statusChanged": false
}
```

### GET /api/issues/list

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| lat | number | - | Center latitude for bounding box |
| lng | number | - | Center longitude for bounding box |
| radius | number | 1000 | Radius in meters |
| status | string | all | Filter by status |
| limit | number | 50 | Max results |

### GET /api/users/leaderboard

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | string | weekly | Enum: `weekly`, `monthly`, `alltime` |
| limit | number | 20 | Max results |

---

## 3. Security Configuration

### Middleware Stack (Applied in Order)
```typescript
// 1. Helmet (security headers)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.googleapis.com", "https://*.gstatic.com", "https://firebasestorage.googleapis.com"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  xFrameOptions: { action: "deny" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// 2. CORS (whitelist only production domain)
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 3. Body parser limits
app.use(express.json({ limit: '10mb' }));

// 4. Rate limiter
app.use('/api/issues/create', rateLimiter({ windowMs: 3600000, max: 10 }));
app.use('/api/verifications/vote', rateLimiter({ windowMs: 86400000, max: 50 }));
```

### Auth Middleware
```typescript
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }
}
```

### Error Handler
```typescript
function errorHandler(err, req, res, next) {
  // Strip API keys from error messages
  const safeMessage = err.message?.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]') || 'Internal error';
  logger.error({ err, requestId: req.id, path: req.path });
  res.status(err.status || 500).json({ error: 'Internal server error' });
}
```

---

## 4. Gemini API Integration

### Call #1: Mega-Analyzer
```typescript
const megaAnalyzerPrompt = `You are a civic infrastructure analyst. Analyze this image.
Return JSON with fields: isValidIssue (bool), category (enum), severity (enum),
priorityScore (1-10), description (2-3 sentences), department (string),
confidence (0.0-1.0), tags (array), reasoning (string).
If the image is not a valid infrastructure issue, set isValidIssue=false
and provide rejectionReason.`;

const response = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ parts: [
    { text: megaAnalyzerPrompt + '\n\nUser description: ' + sanitizedDescription },
    { inlineData: { mimeType: mediaType, data: imageBase64 } }
  ]}],
  generationConfig: { responseMimeType: 'application/json' }
});
```

### Call #2: Router + Verifier
```typescript
const routerPrompt = `Given the following issue analysis and nearby existing issues,
determine: 1) Which municipal department handles this, 2) Is this a duplicate of
any existing issue (compare descriptions and locations), 3) Recommended priority
adjustment based on cluster density.`;
```

### Call #3: Predictor (Async/Scheduled)
- Runs on a cron schedule (every 6 hours) or triggered when issue count exceeds threshold
- Analyzes spatial clusters for hotspot detection
- Updates `predictions` collection in Firestore
