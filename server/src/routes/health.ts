import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Basic connectivity check to Firestore
    await db.collection('health_check').doc('ping').set({
      timestamp: new Date().toISOString()
    });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
