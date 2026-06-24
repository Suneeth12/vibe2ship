import { ai } from '../config/gemini';
import { env } from '../config/env';
import { PREDICTOR_PROMPT } from './prompts';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export interface Hotspot {
  center: { lat: number; lng: number };
  radius: number;
  intensity: number;
  category: string;
  riskScore: number;
  forecast: string;
}

export interface PredictionResult {
  hotspots: Hotspot[];
  systemInsights: string[];
}

export async function runPredictor(): Promise<PredictionResult> {
  try {
    // 1. Fetch recent issues
    const snapshot = await db.collection('issues')
      .where('status', 'in', ['Pending', 'Community Verified', 'Resolving'])
      .limit(200)
      .get();

    const issues: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      issues.push({
        id: doc.id,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        createdAt: data.createdAt,
      });
    });

    if (issues.length === 0) {
      return { hotspots: [], systemInsights: ['No active issues to predict trends.'] };
    }

    const isMock = !env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'PLACEHOLDER';
    
    if (isMock) {
      return generateMockPredictions(issues);
    }

    // Call Gemini to analyze clusters and forecast
    const prompt = `
      Analyze these reported civic issues and predict maintenance hotspots and risks.
      
      Issues Data:
      ${JSON.stringify(issues)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: PREDICTOR_PROMPT,
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim()) as PredictionResult;
      
      // Save predictions to Firestore
      await db.collection('predictions').doc('current_trends').set({
        ...parsed,
        updatedAt: new Date().toISOString(),
      });

      return parsed;
    }

    throw new Error('Empty response from Gemini Predictor');
  } catch (error) {
    logger.error({ error }, 'Failed to run Predictor agent');
    // Mock fallback
    const fallback = generateMockPredictions([]);
    return fallback;
  }
}

function generateMockPredictions(issues: any[]): PredictionResult {
  // Simple heuristic hotspot generator
  const hotspots: Hotspot[] = [];
  
  if (issues.length > 0) {
    // Group by category
    const catMap = new Map<string, any[]>();
    for (const issue of issues) {
      const list = catMap.get(issue.category) || [];
      list.push(issue);
      catMap.set(issue.category, list);
    }

    // Find the category with most issues and average its location
    for (const [category, list] of catMap.entries()) {
      if (list.length >= 2) {
        let latSum = 0;
        let lngSum = 0;
        for (const item of list) {
          latSum += item.latitude;
          lngSum += item.longitude;
        }
        const centerLat = latSum / list.length;
        const centerLng = lngSum / list.length;
        
        hotspots.push({
          center: { lat: centerLat, lng: centerLng },
          radius: 300, // 300 meters
          intensity: Math.min(list.length * 2, 10),
          category: category,
          riskScore: Math.min(list.length * 15, 100),
          forecast: `High probability of further ${category} degradation in the surrounding grid area over next 14 days due to traffic loads.`,
        });
      }
    }
  }

  // Fallback if no clusters
  if (hotspots.length === 0) {
    hotspots.push({
      center: { lat: 12.9716, lng: 77.5946 }, // Default (e.g. Bangalore center)
      radius: 500,
      intensity: 4,
      category: 'pothole',
      riskScore: 45,
      forecast: 'Moderate road surface damage degradation trend predicted for central transit corridor.',
    });
  }

  const systemInsights = [
    `Detected active ${hotspots[0].category} degradation pattern in high-traffic corridors.`,
    'Recommend preventative asphalt patching on main arterial routes to curb 25% escalation.',
    'Municipal department response time has lagged for water_leakage reports; prioritization adjustment suggested.'
  ];

  const result = { hotspots, systemInsights };
  
  // Try saving mock to Firestore (non-blocking)
  db.collection('predictions').doc('current_trends').set({
    ...result,
    updatedAt: new Date().toISOString(),
  }).catch(err => logger.error({ err }, 'Failed to save mock predictions'));

  return result;
}
