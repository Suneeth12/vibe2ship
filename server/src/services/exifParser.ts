import sharp from 'sharp';
import { logger } from '../utils/logger';

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  hasExif?: boolean;
}

export async function processAndStripImage(buffer: Buffer): Promise<{
  cleanBuffer: Buffer;
  metadata: ImageMetadata;
}> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Re-encode image to Jpeg, stripping metadata (EXIF/GPS) automatically
    // sharp's default resize/re-encode strips profiles/EXIF unless keep() is called
    const cleanBuffer = await image
      .rotate() // auto-orient based on EXIF before we strip it
      .resize({ width: 1200, withoutEnlargement: true }) // resize to 1200px max width
      .jpeg({ quality: 85 })
      .toBuffer();

    return {
      cleanBuffer,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasExif: !!metadata.exif,
      }
    };
  } catch (error) {
    logger.error({ error }, 'Failed to process and strip image metadata');
    throw new Error('Invalid image file format or corrupted image');
  }
}

export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  
  if (mimeType === 'image/jpeg') {
    // JPEG magic bytes: FFD8FF
    return hex.startsWith('FFD8FF');
  }
  if (mimeType === 'image/png') {
    // PNG magic bytes: 89504E47
    return hex === '89504E47';
  }
  if (mimeType === 'image/webp') {
    // WebP magic bytes: 52494646 (RIFF) ... 57415645 (WEBP)
    return hex === '52494646'; // Starts with RIFF
  }
  if (mimeType === 'video/mp4') {
    // MP4 magic bytes: usually box type 'ftyp' at offset 4, i.e. contains 'ftyp'
    const boxType = buffer.toString('ascii', 4, 8);
    return boxType === 'ftyp';
  }

  return false;
}
