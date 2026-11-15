export const MAX_PRODUCT_IMAGE_LENGTH = 500000;

export function isUploadedProductImage(value) {
  return typeof value === 'string' && value.length <= MAX_PRODUCT_IMAGE_LENGTH &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) &&
    (value.length - value.indexOf(',') - 1) % 4 === 0;
}

export async function prepareProductImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('This image is too large. Choose a photo under 5 MB.');
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This photo could not be opened. Choose another JPG, PNG or WebP image.');
  }

  try {
    // shortcut: Store small photos in LocalStorage; use file storage when a backend is added.
    const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.65, 0.45]) {
      const image = canvas.toDataURL('image/webp', quality);
      if (isUploadedProductImage(image)) return image;
    }
    throw new Error('This photo is too detailed to save. Choose a smaller image.');
  } finally {
    bitmap.close();
  }
}
