import { MAX_PER_FILE_BYTES, MAX_TOTAL_BYTES } from "./attachmentLimits";

export interface Attachment {
  qid: string;
  name: string;
  b64: string; // contenu encodé base64 (sans préfixe data:)
}

/** Lit un File en base64 (sans le préfixe data:…;base64,). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Applique la politique de pièces jointes en un seul endroit :
 * encode ce qui tient sous le budget, met de côté (sans casser) ce qui est trop lourd.
 */
export async function prepareAttachments(
  files: Record<string, File[]>,
): Promise<{ included: Attachment[]; skipped: string[] }> {
  const included: Attachment[] = [];
  const skipped: string[] = [];
  let budget = MAX_TOTAL_BYTES;
  for (const [qid, list] of Object.entries(files)) {
    for (const f of list) {
      if (f.size > MAX_PER_FILE_BYTES || f.size > budget) {
        skipped.push(f.name);
        continue;
      }
      included.push({ qid, name: f.name, b64: await fileToBase64(f) });
      budget -= f.size;
    }
  }
  return { included, skipped };
}
