/**
 * Utility to automatically optimize and compress user-selected image files or base64 strings
 * into lightweight, high-performance JPEGs (typically ~50KB to 90KB).
 * Prevents Firestore 1MB document size limits and localStorage QuotaExceededError.
 */
export async function optimizeImageForWeb(
  fileOrDataUrl: File | Blob | string,
  maxDimension = 1080,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    let srcUrl = '';
    let isObjectUrl = false;

    if (typeof fileOrDataUrl === 'string') {
      // If it's an external web URL, leave as is
      if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
        return resolve(fileOrDataUrl);
      }
      srcUrl = fileOrDataUrl;
    } else {
      try {
        srcUrl = URL.createObjectURL(fileOrDataUrl);
        isObjectUrl = true;
      } catch {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
        return;
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          if (isObjectUrl) URL.revokeObjectURL(srcUrl);
          return resolve(srcUrl);
        }

        // Smooth image downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG (universal compatibility across all browsers and devices)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        if (isObjectUrl) URL.revokeObjectURL(srcUrl);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('[ImageOptimizer] Canvas compression notice, falling back:', err);
        if (isObjectUrl) URL.revokeObjectURL(srcUrl);
        resolve(srcUrl);
      }
    };

    img.onerror = () => {
      if (isObjectUrl) URL.revokeObjectURL(srcUrl);
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    img.src = srcUrl;
  });
}
