/**
 * Compresses an image file client-side to ensure it does not exceed Firestore document limits (1MB)
 * or browser storage quotas.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 700,
  maxHeight = 700,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it is SVG, read as text/dataURL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to original data URL if image cannot be decoded
        resolve(e.target?.result as string);
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proportionally if dimensions exceed max
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG or WebP
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Encodes an already-loaded HTMLImageElement into an optimized JPEG data URL
 * safely under the target byte limit for Cloud Firestore storage.
 */
export function compressImageElementToDataUrl(
  img: HTMLImageElement,
  maxBytes = 420000
): string | null {
  try {
    if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      return null;
    }

    const attempts = [
      { maxDim: 760, quality: 0.76 },
      { maxDim: 620, quality: 0.68 },
      { maxDim: 500, quality: 0.58 },
      { maxDim: 400, quality: 0.5 }
    ];

    for (const { maxDim, quality } of attempts) {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maxBytes) {
        return dataUrl;
      }
    }

    // Final guaranteed compact fallback
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = Math.max(1, Math.round((img.naturalHeight * 360) / img.naturalWidth));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.45);
  } catch {
    return null;
  }
}

/**
 * Compresses an uploaded File or existing data:image URL so it is guaranteed
 * to fit comfortably inside a single Cloud Firestore document (< 420KB).
 */
export async function compressImageForFirestore(
  source: File | string,
  maxBytes = 420000
): Promise<string> {
  if (typeof source === 'string') {
    if (!source.startsWith('data:image/') || source.length <= maxBytes) {
      return source;
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const compressed = compressImageElementToDataUrl(img, maxBytes);
        resolve(compressed || source);
      };
      img.onerror = () => resolve(source);
      img.src = source;
    });
  }

  let result = await compressImageFile(source, 760, 760, 0.76);
  if (result.length > maxBytes) {
    result = await compressImageFile(source, 600, 600, 0.65);
  }
  if (result.length > maxBytes) {
    result = await compressImageFile(source, 460, 460, 0.55);
  }
  return result;
}

/**
 * Compresses logos, emblems, and brand assets while preserving SVG and PNG transparency
 * when possible, and guarantees the output fits safely inside Cloud Firestore (< 380KB).
 */
export async function compressBrandImageForFirestore(
  source: File | string,
  maxBytes = 380000
): Promise<string> {
  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const rawDataUrl = typeof source === 'string' ? source : await readAsDataUrl(source);
  if (!rawDataUrl || !rawDataUrl.startsWith('data:image/')) {
    return rawDataUrl;
  }

  // Keep compact SVG or already-small images directly
  if (rawDataUrl.startsWith('data:image/svg+xml') && rawDataUrl.length <= maxBytes) {
    return rawDataUrl;
  }
  if (rawDataUrl.length <= maxBytes) {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const tryDimensions = [460, 360, 280, 220];
      for (const maxDim of tryDimensions) {
        let width = img.naturalWidth || img.width || maxDim;
        let height = img.naturalHeight || img.height || maxDim;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.max(1, Math.round((height * maxDim) / width));
            width = maxDim;
          } else {
            width = Math.max(1, Math.round((width * maxDim) / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) break;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const pngUrl = canvas.toDataURL('image/png');
          if (pngUrl.length <= maxBytes) {
            resolve(pngUrl);
            return;
          }
        } catch {
          // Ignore and try smaller or JPEG fallback
        }
      }

      // Fallback to high-efficiency JPEG compression if PNG remains too large
      const jpegFallback = compressImageElementToDataUrl(img, maxBytes);
      resolve(jpegFallback || rawDataUrl);
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}


