// Miniature d'invité : la photo est recadrée en carré et compressée CÔTÉ CLIENT
// avant tout envoi — on ne fait jamais transiter l'original (limite de corps
// Vercel ~4,5 Mo, et le mur des invités n'a besoin que d'une vignette).

const SIZE = 288;
const QUALITY = 0.78;

export async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Ce fichier n'est pas une image.");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible dans ce navigateur.");
    // Recadrage « cover » centré : on garde le carré central de la photo.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
    const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
    if (dataUrl.length > 200_000) throw new Error("Photo illisible après compression — essaie-en une autre.");
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de lire cette image."));
    img.src = url;
  });
}
