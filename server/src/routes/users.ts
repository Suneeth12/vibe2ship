import { Response } from 'express';
import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /profile - Get profile of current authenticated user
router.get('/profile', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.uid;

  try {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      // Auto-create user document if it doesn't exist yet (first-time login)
      const newProfile = {
        email: req.user!.email || '',
        displayName: req.user!.email ? req.user!.email.split('@')[0] : 'Anonymous Hero',
        avatarUrl: `https://picsum.photos/seed/${userId}/100`,
        role: req.user!.role || 'reporter',
        points: 0,
        level: 1,
        trustScore: 50,
        joinedAt: new Date().toISOString(),
      };
      
      await userRef.set(newProfile);
      
      // Seed leaderboard
      await db.collection('leaderboard').doc(userId).set({
        displayName: newProfile.displayName,
        points: 0,
        level: 1,
        lastUpdated: new Date().toISOString(),
      });

      return res.json({ id: userId, ...newProfile });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    logger.error({ error, userId }, 'Error fetching user profile');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /leaderboard - Get leaderboard rankings
router.get('/leaderboard', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  try {
    const snapshot = await db.collection('leaderboard')
      .orderBy('points', 'desc')
      .limit(limit)
      .get();

    const ranking: any[] = [];
    snapshot.forEach((doc: any) => {
      ranking.push({
        userId: doc.id,
        ...doc.data()
      });
    });

    res.json(ranking);
  } catch (error) {
    logger.error({ error }, 'Error fetching leaderboard');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
