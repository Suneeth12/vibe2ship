import piexif from 'piexifjs';

export interface CleanedImageResult {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  cleanBlob: Blob;
}

// Convert an EXIF GPS rational array [[num,den],[num,den],[num,den]] (deg/min/sec)
// plus a hemisphere ref ('N'/'S'/'E'/'W') into signed decimal degrees.
function dmsToDecimal(dms: any, ref: string | undefined): number | undefined {
  if (!Array.isArray(dms) || dms.length < 3) return undefined;
  const toNum = (pair: any) =>
    Array.isArray(pair) && pair[1] ? pair[0] / pair[1] : Number(pair);
  const deg = toNum(dms[0]);
  const min = toNum(dms[1]);
  const sec = toNum(dms[2]);
  if ([deg, min, sec].some((n) => Number.isNaN(n))) return undefined;
  let decimal = deg + min / 60 + sec / 3600;
  if (ref === 'S' || ref === 'W') decimal *= -1;
  return decimal;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Reads GPS coordinates and original timestamp from a JPEG's EXIF, if present.
// Only JPEGs carry EXIF; anything else (or a parse failure) yields no metadata.
async function readExif(file: File): Promise<Pick<CleanedImageResult, 'latitude' | 'longitude' | 'timestamp'>> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') return {};
  try {
    const dataUrl = await readAsDataUrl(file);
    const exif = piexif.load(dataUrl);
    const gps = exif.GPS || {};

    const latitude = dmsToDecimal(
      gps[piexif.GPSIFD.GPSLatitude],
      gps[piexif.GPSIFD.GPSLatitudeRef]
    );
    const longitude = dmsToDecimal(
      gps[piexif.GPSIFD.GPSLongitude],
      gps[piexif.GPSIFD.GPSLongitudeRef]
    );

    const exifIfd = exif.Exif || {};
    const rawTimestamp = exifIfd[piexif.ExifIFD.DateTimeOriginal];
    const timestamp = typeof rawTimestamp === 'string' ? rawTimestamp : undefined;

    return { latitude, longitude, timestamp };
  } catch (err) {
    console.warn('Could not parse EXIF metadata:', err);
    return {};
  }
}

export async function extractAndStripExif(file: File): Promise<CleanedImageResult> {
  try {
    // Read EXIF before re-encoding (re-encoding via canvas drops all metadata).
    const meta = await readExif(file);
    const cleanBlob = await reencodeImage(file);
    return { ...meta, cleanBlob };
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
