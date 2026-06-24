import { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/firebase';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { voteLimiter } from '../middleware/rateLimiter';
import { calculateDistance, calculateNewConsensus } from '../services/consensus';
import { logEvent } from '../utils/auditLog';
import { logger } from '../utils/logger';

const router = Router();

const voteSchema = z.object({
  issueId: z.string().min(1, 'issueId is required'),
  vote: z.enum(['Confirm', 'Spam']),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

router.post(
  '/vote',
  verifyAuth,
  voteLimiter,
  validateBody(voteSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { issueId, vote, latitude, longitude } = req.body;
    const voterId = req.user!.uid;

    try {
      const issueRef = db.collection('issues').doc(issueId);
      const userRef = db.collection('users').doc(voterId);
      const verificationId = `${issueId}_${voterId}`;
      const verificationRef = db.collection('verifications').doc(verificationId);

      // Run Firestore transaction
      const result = await db.runTransaction(async (transaction: any) => {
        // 1. Check if user already voted
        const verificationDoc = await transaction.get(verificationRef);
        if (verificationDoc.exists) {
          throw { status: 400, message: 'You have already voted on this issue' };
        }

        // 2. Fetch issue data
        const issueDoc = await transaction.get(issueRef);
        if (!issueDoc.exists) {
          throw { status: 404, message: 'Issue not found' };
        }
        const issueData = issueDoc.data()!;

        // 3. Geofence Check: Must be within 500m
        const distance = calculateDistance(
          latitude,
          longitude,
          issueData.latitude,
          issueData.longitude
        );
        if (distance > 500) {
          throw { status: 400, message: 'You must be within 500 meters of the issue location to vote' };
        }

        // 4. Fetch voter trust score
        const userDoc = await transaction.get(userRef);
        let voterTrustScore = 50; // default trust score
        if (userDoc.exists) {
          voterTrustScore = userDoc.data()!.trustScore || 50;
        }

        // 5. Calculate new consensus
        const currentScore = issueData.consensusScore || 0;
        const currentStatus = issueData.status || 'Pending';
        const consensusResult = calculateNewConsensus(
          currentScore,
          currentStatus,
          vote,
          voterTrustScore
        );

        // 6. Update issue
        const updates: any = {
          consensusScore: consensusResult.newScore,
          votesCount: (issueData.votesCount || 0) + 1,
          updatedAt: new Date().toISOString()
        };

        if (consensusResult.newStatus) {
          updates.status = consensusResult.newStatus;
        }

        transaction.update(issueRef, updates);

        // 7. Write verification
        transaction.set(verificationRef, {
          issueId,
          userId: voterId,
          vote,
          voterTrustScore,
          votedAt: new Date().toISOString()
        });

        // 8. Award voter points (+5 points for voting)
        let voterPoints = 5;
        let voterLevel = 1;
        if (userDoc.exists) {
          const uData = userDoc.data()!;
          voterPoints = (uData.points || 0) + 5;
          voterLevel = Math.floor(Math.sqrt(voterPoints / 100)) + 1;
        }
        transaction.set(userRef, {
          points: voterPoints,
          level: voterLevel,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update voter in leaderboard
        const leaderboardRef = db.collection('leaderboard').doc(voterId);
        transaction.set(leaderboardRef, {
          points: voterPoints,
          level: voterLevel,
          lastUpdated: new Date().toISOString()
        }, { merge: true });

        return {
          newScore: consensusResult.newScore,
          statusChanged: !!consensusResult.newStatus,
          newStatus: consensusResult.newStatus || currentStatus
        };
      });

      // Log event
      await logEvent('VOTE_CAST', `issues/${issueId}`, `Vote: ${vote}, New Score: ${result.newScore}`, voterId);

      res.status(201).json({
        voteRecorded: true,
        newConsensusScore: result.newScore,
        statusChanged: result.statusChanged,
        newStatus: result.newStatus
      });

    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      logger.error({ error, issueId }, 'Error casting verification vote');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
