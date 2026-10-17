/**
 * Image processing and avatar presets utilities for Majlis
 */

export const AVATAR_PRESETS: { id: string; label: string; svgDataUri: string }[] = [
  {
    id: 'falcon',
    label: 'صقر',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232AABEE"/><text x="50" y="62" font-size="46" text-anchor="middle">🦅</text></svg>`,
  },
  {
    id: 'palm',
    label: 'نخلة',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2310b981"/><text x="50" y="62" font-size="46" text-anchor="middle">🌴</text></svg>`,
  },
  {
    id: 'camel',
    label: 'جمل',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f59e0b"/><text x="50" y="62" font-size="46" text-anchor="middle">🐪</text></svg>`,
  },
  {
    id: 'coffee',
    label: 'دلة قهوة',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238b5cf6"/><text x="50" y="62" font-size="46" text-anchor="middle">☕</text></svg>`,
  },
  {
    id: 'horse',
    label: 'خيل عربي',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ec4899"/><text x="50" y="62" font-size="46" text-anchor="middle">🐎</text></svg>`,
  },
  {
    id: 'crescent',
    label: 'هلال ونجمة',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2306b6d4"/><text x="50" y="62" font-size="46" text-anchor="middle">🌙</text></svg>`,
  },
  {
    id: 'lion',
    label: 'أسد',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f97316"/><text x="50" y="62" font-size="46" text-anchor="middle">🦁</text></svg>`,
  },
  {
    id: 'shield',
    label: 'درع',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236366f1"/><text x="50" y="62" font-size="46" text-anchor="middle">🛡️</text></svg>`,
  },
  {
    id: 'crown',
    label: 'تاج',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23eab308"/><text x="50" y="62" font-size="46" text-anchor="middle">👑</text></svg>`,
  },
  {
    id: 'sparkle',
    label: 'نجم',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2314b8a6"/><text x="50" y="62" font-size="46" text-anchor="middle">⭐</text></svg>`,
  },
  {
    id: 'fire',
    label: 'شعلة',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ef4444"/><text x="50" y="62" font-size="46" text-anchor="middle">🔥</text></svg>`,
  },
  {
    id: 'pen',
    label: 'قلم ديواني',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%233b82f6"/><text x="50" y="62" font-size="46" text-anchor="middle">✒️</text></svg>`,
  },
];

/**
 * Resizes and compresses an uploaded image file into a square avatar data URL (WebP or JPEG).
 * Target max dimensions: 140x140 px, quality 0.82.
 * Output size is typically 8-20 KB.
 */
export async function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic file type validation
    if (!file.type.startsWith('image/')) {
      return reject(new Error('يرجى اختيار ملف صورة صالح'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشلت قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر تحميل الصورة'));
      img.onload = () => {
        try {
          const maxDim = 140;
          let width = img.width;
          let height = img.height;

          // Crop square from center
          const minSide = Math.min(width, height);
          const startX = (width - minSide) / 2;
          const startY = (height - minSide) / 2;

          const canvas = document.createElement('canvas');
          canvas.width = maxDim;
          canvas.height = maxDim;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('تعذر معالجة الصورة'));
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped center square scaled to maxDim x maxDim
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

          // Export as WebP if supported, fallback to JPEG
          let dataUrl = canvas.toDataURL('image/webp', 0.82);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
