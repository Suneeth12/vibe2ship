import { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { db, storage } from '../config/firebase';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { issueCreationLimiter } from '../middleware/rateLimiter';
import { processReportPipeline } from '../agents/pipeline';
import { sanitize } from '../utils/sanitize';
import { calculateDistance } from '../services/consensus';
import { validateMagicBytes, processAndStripImage } from '../services/exifParser';
import { logger } from '../utils/logger';

const router = Router();

// Zod schema for issue creation
const createIssueSchema = z.object({
  mediaUrl: z.string().min(1, 'mediaUrl is required'),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional().default(''),
  latitude: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90),
  longitude: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180),
  imageBase64: z.string().optional(), // Optional base64 passed directly by client
});

// Zod schema for listing issues
const listIssuesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(50000).optional().default(5000), // Default 5km
  status: z.string().optional().default('all'),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

// POST /create - Submit issue
router.post(
  '/create',
  verifyAuth,
  issueCreationLimiter,
  validateBody(createIssueSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { mediaUrl, mediaType, description, latitude, longitude, imageBase64 } = req.body;
    const reporterId = req.user!.uid;

    try {
      let imageBuffer: Buffer | null = null;

      // 1. Process image buffer if provided in request, or download from Firebase Storage
      if (imageBase64) {
        imageBuffer = Buffer.from(imageBase64, 'base64');
      } else if (mediaUrl.startsWith('http') && mediaType.startsWith('image/')) {
        // Retrieve from Firebase Storage
        try {
          // Extract file path from URL (GCS format)
          const bucket = storage.bucket();
          // Extract path between /o/ and ?alt=media
          const urlParts = decodeURIComponent(mediaUrl).split('/o/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0];
            const file = bucket.file(filePath);
            const [buffer] = await file.download();
            imageBuffer = buffer;
          }
        } catch (downloadErr) {
          logger.warn({ downloadErr, mediaUrl }, 'Failed to download image from Storage. Proceeding with text-only AI analysis.');
        }
      }

      // 2. Validate magic bytes and strip EXIF if buffer is present
      if (imageBuffer && mediaType.startsWith('image/')) {
        if (!validateMagicBytes(imageBuffer, mediaType)) {
          return res.status(400).json({ error: 'Uploaded file magic bytes do not match declared image type' });
        }
        
        try {
          const processed = await processAndStripImage(imageBuffer);
          imageBuffer = processed.cleanBuffer;
        } catch (err) {
          logger.warn({ err }, 'Image cleanup failed, using raw buffer');
        }
      }

      // 3. Clean user description
      const sanitizedDescription = sanitize(description);

      // 4. Run through AI Agentic pipeline
      const pipelineResult = await processReportPipeline(
        reporterId,
        mediaUrl,
        mediaType,
        imageBuffer,
        sanitizedDescription,
        latitude,
        longitude
      );

      if (!pipelineResult.success) {
        return res.status(200).json({
          status: 'Rejected',
          message: pipelineResult.message,
          rejectionReason: pipelineResult.rejectionReason
        });
      }

      res.status(201).json({
        issueId: pipelineResult.issueId,
        status: 'Submitted',
        agentResults: pipelineResult.agentResults
      });

    } catch (error: any) {
      logger.error({ error }, 'Error creating issue report');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /list - List issues
router.get(
  '/list',
  validateQuery(listIssuesSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { lat, lng, radius, status, limit } = req.query as any;

    try {
      let query: any = db.collection('issues');
      
      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.limit(100).get(); // fetch up to 100 to filter geospatially
      const issues: any[] = [];

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        let include = true;

        if (lat !== undefined && lng !== undefined) {
          const dist = calculateDistance(lat, lng, data.latitude, data.longitude);
          if (dist > radius) {
            include = false;
          }
          data.distance = dist;
        }

        if (include) {
          issues.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by distance if location provided, else by creation time
      if (lat !== undefined && lng !== undefined) {
        issues.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      res.json(issues.slice(0, limit));
    } catch (error) {
      logger.error({ error }, 'Error listing issues');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /:id - Get issue detail
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const issueId = req.params.id;

  try {
    const doc = await db.collection('issues').doc(issueId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    logger.error({ error, issueId }, 'Error getting issue detail');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
