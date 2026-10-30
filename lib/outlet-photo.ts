const MAX_PHOTO_BYTES = 512 * 1024;

/** Decodes a raster upload and returns a JPEG data URL capped at 1600px and 512 KiB. */
export async function prepareOutletPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP photo.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a photo smaller than 10 MiB.");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This photo could not be opened. Choose another image.");
  }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo processing is unavailable in this browser.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const photo = canvas.toDataURL("image/jpeg", quality);
      const base64 = photo.slice(photo.indexOf(",") + 1);
      const bytes =
        (base64.length * 3) / 4 -
        (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
      if (bytes <= MAX_PHOTO_BYTES) return photo;
    }
    throw new Error(
      "This photo is too detailed to save. Choose a smaller image.",
    );
  } finally {
    bitmap.close();
  }
}
