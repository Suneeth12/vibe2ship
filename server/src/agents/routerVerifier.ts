import { ai } from '../config/gemini';
import { env } from '../config/env';
import { ROUTER_VERIFIER_PROMPT } from './prompts';
import { db } from '../config/firebase';
import { computeHammingDistance } from '../services/imageHash';
import { calculateDistance } from '../services/consensus';
import { logger } from '../utils/logger';

export interface RouteVerificationResult {
  isDuplicate: boolean;
  duplicateOfId: string | null;
  priorityAdjustment: number;
  reasoning: string;
}

export async function routeAndVerify(
  newIssue: {
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    dHash?: string;
  }
): Promise<RouteVerificationResult> {
  try {
    // 1. Fetch potentially nearby issues from Firestore
    // To keep it simple and performant, query issues with same category within a coordinate bounding box
    const latDelta = 0.0045; // Approx 500 meters
    const lngDelta = 0.0045;
    
    const snapshot = await db.collection('issues')
      .where('category', '==', newIssue.category)
      .where('latitude', '>=', newIssue.latitude - latDelta)
      .where('latitude', '<=', newIssue.latitude + latDelta)
      .get();

    const nearbyIssues: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      // Precise distance calculation
      const dist = calculateDistance(newIssue.latitude, newIssue.longitude, data.latitude, data.longitude);
      if (dist <= 150) { // Check duplicates within 150 meters
        nearbyIssues.push({
          id: doc.id,
          description: data.description || '',
          latitude: data.latitude,
          longitude: data.longitude,
          distance: dist,
          dHash: data.dHash || null,
        });
      }
    });

    // 2. Perform dHash matching if new issue has hash and nearby issues have hashes
    if (newIssue.dHash) {
      for (const nearby of nearbyIssues) {
        if (nearby.dHash) {
          const dist = computeHammingDistance(newIssue.dHash, nearby.dHash);
          if (dist <= 10) { // Hamming distance threshold of 10
            return {
              isDuplicate: true,
              duplicateOfId: nearby.id,
              priorityAdjustment: 0,
              reasoning: `Duplicate detected via image dHash matching (Hamming distance = ${dist}) with issue ${nearby.id} at ${nearby.distance.toFixed(1)}m.`,
            };
          }
        }
      }
    }

    // 3. Fallback to Gemini comparison if there are nearby issues, to evaluate semantic duplicate status
    if (nearbyIssues.length > 0) {
      const isMock = !env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'PLACEHOLDER';
      
      if (isMock) {
        if (env.NODE_ENV === 'production') {
          throw new Error('Gemini API mock semantic comparator is disabled in production.');
        }
        // Mock semantic comparison
        for (const nearby of nearbyIssues) {
          if (nearby.distance < 30) { // Very close by
            return {
              isDuplicate: true,
              duplicateOfId: nearby.id,
              priorityAdjustment: 0,
              reasoning: `Duplicate detected via close proximity mock match (<30m) with issue ${nearby.id}.`,
            };
          }
        }
      } else {
        const prompt = `
          New issue:
          - Category: ${newIssue.category}
          - Description: "${newIssue.description}"
          - Coordinates: (${newIssue.latitude}, ${newIssue.longitude})

          Nearby existing issues:
          ${nearbyIssues.map((n, i) => `${i+1}. ID: ${n.id}, Description: "${n.description}", Distance: ${n.distance.toFixed(1)}m`).join('\n')}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: ROUTER_VERIFIER_PROMPT,
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim()) as RouteVerificationResult;
          return parsed;
        }
      }
    }

    // If no duplicate found, return standard result
    return {
      isDuplicate: false,
      duplicateOfId: null,
      priorityAdjustment: nearbyIssues.length > 3 ? 1.0 : 0.0, // Boost priority if area has cluster of issues
      reasoning: `No matching duplicate. Nearby cluster count: ${nearbyIssues.length}.`,
    };

  } catch (error) {
    logger.error({ error }, 'Error in Router-Verifier agent');
    // Safe fallback
    return {
      isDuplicate: false,
      duplicateOfId: null,
      priorityAdjustment: 0,
      reasoning: 'Router-Verifier failed or timed out. Falling back to non-duplicate status.',
    };
  }
}
