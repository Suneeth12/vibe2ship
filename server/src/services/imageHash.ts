import sharp from 'sharp';
import { logger } from '../utils/logger';

export async function computeDHash(imageBuffer: Buffer): Promise<string> {
  try {
    // Resize to 9x8, convert to raw grayscale bytes (one byte per pixel)
    const raw = await sharp(imageBuffer)
      .resize(9, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();

    let hash = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftIdx = row * 9 + col;
        const rightIdx = leftIdx + 1;
        
        const leftPixel = raw[leftIdx];
        const rightPixel = raw[rightIdx];
        
        hash += leftPixel > rightPixel ? '1' : '0';
      }
    }

    // Convert 64-bit binary string to 16-character hex string
    let hexHash = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = hash.substring(i, i + 4);
      hexHash += parseInt(nibble, 2).toString(16);
    }

    return hexHash;
  } catch (error) {
    logger.error({ error }, 'Failed to compute dHash');
    throw error;
  }
}

export function computeHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 64; // Max distance if mismatch

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    // Convert hex characters to 4-bit integers and XOR them
    const val1 = parseInt(hash1[i], 16);
    const val2 = parseInt(hash2[i], 16);
    let xor = val1 ^ val2;
    
    // Count set bits
    while (xor > 0) {
      if (xor & 1) distance++;
      xor >>= 1;
    }
  }

  return distance;
}
