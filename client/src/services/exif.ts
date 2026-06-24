export interface CleanedImageResult {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  cleanBlob: Blob;
}

export async function extractAndStripExif(file: File): Promise<CleanedImageResult> {
  try {
    const cleanBlob = await reencodeImage(file);
    return { cleanBlob };
  } catch (error) {
    console.error('Error stripping EXIF:', error);
    return { cleanBlob: file };
  }
}

function reencodeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No context'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Blob null')), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
  });
}
