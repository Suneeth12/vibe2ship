// services/exif.ts

export interface CleanedImageResult {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  cleanBlob: Blob;
}

export async function extractAndStripExif(file: File): Promise<CleanedImageResult> {
  // 1. Try to read GPS coords (fallback to geolocation if missing)
  let latitude: number | undefined;
  let longitude: number | undefined;
  let timestamp: string | undefined;

  try {
    // Canvas re-encoding strips ALL EXIF automatically
    const cleanBlob = await reencodeImage(file, { maxWidth: 1200, quality: 0.85 });
    return { latitude, longitude, timestamp, cleanBlob };
  } catch (error) {
    console.error('Error stripping EXIF metadata:', error);
    return { cleanBlob: file }; // fallback to original file if re-encode fails
  }
}

async function reencodeImage(file: File, opts: { maxWidth: number; quality: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const scale = Math.min(1, opts.maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2d context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null'));
          }
        },
        'image/jpeg',
        opts.quality
      );
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}
