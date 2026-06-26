import { ai } from '../config/gemini';
import { env } from '../config/env';
import { MEGA_ANALYZER_PROMPT } from './prompts';
import { logger } from '../utils/logger';

export interface MegaAnalysisResult {
  isValidIssue: boolean;
  rejectionReason?: string;
  category?: 'pothole' | 'water_leakage' | 'damaged_streetlight' | 'waste_dumping' | 'broken_sidewalk' | 'graffiti' | 'fallen_tree' | 'flooding' | 'other';
  subcategory?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  priorityScore?: number;
  description?: string;
  suggestedDepartment?: string;
  confidence?: number;
  tags?: string[];
  reasoning?: string;
}

export async function analyzeIssue(
  imageBase64: string | null,
  mediaType: string,
  userDescription: string
): Promise<MegaAnalysisResult> {
  const isMock = !env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'PLACEHOLDER';
  
  if (isMock) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Gemini API mock analyzer fallback is disabled in production.');
    }
    logger.warn('Gemini API key is missing/placeholder. Falling back to mock analyzer.');
    return mockAnalysis(userDescription, mediaType);
  }

  try {
    const contents: any[] = [
      `User-provided description: "${userDescription || 'No description provided'}"`
    ];

    if (imageBase64) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mediaType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: MEGA_ANALYZER_PROMPT,
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(response.text.trim()) as MegaAnalysisResult;
    return parsed;
  } catch (error) {
    logger.error({ error }, 'Failed to run Mega-Analyzer agent');
    if (env.NODE_ENV === 'production') {
      throw error;
    }
    // If Gemini fails, fall back to mock instead of crashing
    logger.warn('Falling back to mock analyzer due to Gemini API failure.');
    return mockAnalysis(userDescription, mediaType);
  }
}

function mockAnalysis(description: string, mediaType: string): MegaAnalysisResult {
  const descLower = (description || '').toLowerCase();
  let category: MegaAnalysisResult['category'] = 'other';
  let subcategory = 'general infrastructure issue';
  let suggestedDepartment = 'Public Works';
  let severity: MegaAnalysisResult['severity'] = 'medium';
  let priorityScore = 5;

  if (descLower.includes('pothole') || descLower.includes('road') || descLower.includes('asphalt') || descLower.includes('street')) {
    category = 'pothole';
    subcategory = 'asphalt road pothole';
    suggestedDepartment = 'Public Works';
    severity = 'high';
    priorityScore = 8;
  } else if (descLower.includes('light') || descLower.includes('streetlight') || descLower.includes('dark') || descLower.includes('lamp')) {
    category = 'damaged_streetlight';
    subcategory = 'non-functioning streetlight lamp';
    suggestedDepartment = 'Transportation';
    severity = 'medium';
    priorityScore = 6;
  } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('pipe') || descLower.includes('sewer')) {
    category = 'water_leakage';
    subcategory = 'pipe leakage on public road';
    suggestedDepartment = 'Water & Sanitation';
    severity = 'high';
    priorityScore = 7;
  } else if (descLower.includes('trash') || descLower.includes('garbage') || descLower.includes('dump') || descLower.includes('waste')) {
    category = 'waste_dumping';
    subcategory = 'illegal trash accumulation';
    suggestedDepartment = 'Water & Sanitation';
    severity = 'low';
    priorityScore = 4;
  } else if (descLower.includes('flood') || descLower.includes('water') || descLower.includes('clog')) {
    category = 'flooding';
    subcategory = 'blocked storm drain flooding';
    suggestedDepartment = 'Public Works';
    severity = 'critical';
    priorityScore = 9;
  }

  return {
    isValidIssue: true,
    category,
    subcategory,
    severity,
    priorityScore,
    description: `Mock processed technical description for: ${description || 'Civic infrastructure report.'}`,
    suggestedDepartment,
    confidence: 0.95,
    tags: [category, severity, 'community-report'],
    reasoning: 'Report parsed using mock heuristics fallback mode.'
  };
}
