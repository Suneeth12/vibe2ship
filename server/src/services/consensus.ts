import { logger } from '../utils/logger';

// Calculate distance in meters using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

export interface ConsensusResult {
  newScore: number;
  newStatus?: 'Community Verified' | 'Rejected' | 'Pending';
}

export function calculateNewConsensus(
  currentScore: number,
  currentStatus: string,
  vote: 'Confirm' | 'Spam',
  voterTrustScore: number
): ConsensusResult {
  const weight = voterTrustScore / 100;
  const change = vote === 'Confirm' ? weight : -weight;
  const newScore = Math.round((currentScore + change) * 100) / 100; // Round to 2 decimal places

  let newStatus: 'Community Verified' | 'Rejected' | 'Pending' | undefined;

  if (currentStatus === 'Pending') {
    if (newScore >= 3.0) {
      newStatus = 'Community Verified';
    } else if (newScore <= -3.0) {
      newStatus = 'Rejected';
    }
  }

  return {
    newScore,
    newStatus,
  };
}
