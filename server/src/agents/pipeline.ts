import { analyzeIssue, MegaAnalysisResult } from './megaAnalyzer';
import { routeAndVerify } from './routerVerifier';
import { reverseGeocode } from '../services/geocoding';
import { db } from '../config/firebase';
import { computeDHash } from '../services/imageHash';
import { logEvent } from '../utils/auditLog';
import { logger } from '../utils/logger';

export interface PipelineResult {
  success: boolean;
  message: string;
  issueId?: string;
  rejectionReason?: string;
  agentResults?: {
    triage: { isValid: boolean };
    category: string;
    severity: string;
    department: string;
    confidence: number;
    isDuplicate: boolean;
    duplicateOfId: string | null;
  };
}

export async function processReportPipeline(
  reporterId: string,
  mediaUrl: string,
  mediaType: string,
  imageBuffer: Buffer | null,
  description: string,
  latitude: number,
  longitude: number
): Promise<PipelineResult> {
  logger.info({ reporterId, mediaType, latitude, longitude }, 'Starting agentic pipeline processing for report');
  
  try {
    // 1. Compute dHash for duplicate detection if it's an image
    let dHash: string | undefined;
    if (imageBuffer && mediaType.startsWith('image/')) {
      try {
        dHash = await computeDHash(imageBuffer);
      } catch (err) {
        logger.warn({ err }, 'Failed to compute dHash, continuing pipeline without it');
      }
    }

    // Convert buffer to base64 for Gemini Vision
    const imageBase64 = imageBuffer ? imageBuffer.toString('base64') : null;

    // 2. Call Mega-Analyzer (Triage + Categorize + Priority)
    const analysis = await analyzeIssue(imageBase64, mediaType, description);
    logger.info({ analysis }, 'Mega-Analyzer completed processing');

    if (!analysis.isValidIssue) {
      await logEvent('TRIAGE_REJECTED', 'issues', 'Triage agent flagged report as invalid', reporterId);
      return {
        success: false,
        message: 'Report rejected by AI Triage.',
        rejectionReason: analysis.rejectionReason || 'Invalid issue image or description.'
      };
    }

    // 3. Call Router-Verifier (Deduplicate & Route)
    const verification = await routeAndVerify({
      category: analysis.category!,
      description: description || analysis.description || '',
      latitude,
      longitude,
      dHash,
    });
    logger.info({ verification }, 'Router-Verifier completed processing');

    // 4. Reverse Geocode Location
    const address = await reverseGeocode(latitude, longitude);

    // 5. Finalize details and write to Firestore
    const issueRef = db.collection('issues').doc();
    const issueId = issueRef.id;

    // Save imageHash to DB if available
    if (dHash && !verification.isDuplicate) {
      await db.collection('imageHashes').add({
        hash: dHash,
        issueId,
        latitude,
        longitude,
        createdAt: new Date().toISOString(),
      });
    }

    const finalPriorityScore = Math.max(1, Math.min(10, (analysis.priorityScore || 5) + verification.priorityAdjustment));
    
    // Default values for user fields
    const issueDoc = {
      reporterId,
      mediaUrl,
      mediaType,
      description: description || analysis.description || '',
      latitude,
      longitude,
      address,
      category: analysis.category,
      subcategory: analysis.subcategory || 'General',
      severity: analysis.severity || 'medium',
      priorityScore: finalPriorityScore,
      suggestedDepartment: analysis.suggestedDepartment || 'Public Works',
      department: analysis.suggestedDepartment || 'Public Works',
      status: verification.isDuplicate ? 'Rejected' : 'Pending',
      confidence: analysis.confidence || 0.9,
      tags: analysis.tags || [],
      reasoning: analysis.reasoning || '',
      isDuplicateOf: verification.duplicateOfId,
      consensusScore: 0.0,
      votesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dHash: dHash || null,
      open311: {
        service_code: mapCategoryToOpen311(analysis.category || 'other'),
        service_request_id: `req_${issueId.substring(0, 8)}`,
        agency_responsible: analysis.suggestedDepartment || 'Public Works',
      }
    };

    await issueRef.set(issueDoc);

    // Log the event
    await logEvent(
      verification.isDuplicate ? 'DUPLICATE_DETECTED' : 'ISSUE_CREATED', 
      `issues/${issueId}`, 
      verification.isDuplicate ? `Duplicate of ${verification.duplicateOfId}` : 'New issue successfully processed',
      reporterId
    );

    // Boost reporter stats (non-blocking)
    if (!verification.isDuplicate) {
      updateReporterStats(reporterId, 10); // +10 points for a new report
    }

    return {
      success: true,
      message: verification.isDuplicate ? 'Duplicate issue reported and merged.' : 'Issue successfully reported.',
      issueId,
      agentResults: {
        triage: { isValid: true },
        category: analysis.category || 'other',
        severity: analysis.severity || 'medium',
        department: analysis.suggestedDepartment || 'Public Works',
        confidence: analysis.confidence || 0.9,
        isDuplicate: verification.isDuplicate,
        duplicateOfId: verification.duplicateOfId,
      }
    };

  } catch (error) {
    logger.error({ error }, 'Fatal error in processing report pipeline');
    throw error;
  }
}

async function updateReporterStats(userId: string, pointsToAdd: number) {
  try {
    const userRef = db.collection('users').doc(userId);
    const leaderboardRef = db.collection('leaderboard').doc(userId);

    await db.runTransaction(async (transaction: any) => {
      const userDoc = await transaction.get(userRef);
      
      let points = pointsToAdd;
      let level = 1;
      let trustScore = 50;
      let displayName = 'Anonymous Hero';

      if (userDoc.exists) {
        const data = userDoc.data()!;
        points = (data.points || 0) + pointsToAdd;
        level = Math.floor(Math.sqrt(points / 100)) + 1; // standard RPG level formula
        trustScore = Math.min(100, (data.trustScore || 50) + 1); // increment trust slightly for good reports
        displayName = data.displayName || displayName;
      }

      transaction.set(userRef, {
        points,
        level,
        trustScore,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      transaction.set(leaderboardRef, {
        displayName,
        points,
        level,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    });
  } catch (err) {
    logger.error({ err, userId }, 'Failed to update reporter stats in transaction');
  }
}

function mapCategoryToOpen311(category: string): string {
  const codes: Record<string, string> = {
    pothole: '001',
    water_leakage: '002',
    damaged_streetlight: '003',
    waste_dumping: '004',
    broken_sidewalk: '005',
    graffiti: '006',
    fallen_tree: '007',
    flooding: '008',
    other: '099',
  };
  return codes[category] || '099';
}
