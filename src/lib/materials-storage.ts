import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "materials");
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function savePdfFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const storedName = `${crypto.randomUUID()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  return { fileUrl: `/uploads/materials/${storedName}`, fileName: file.name };
}

export async function deletePdfFile(fileUrl: string) {
  const fileName = path.basename(fileUrl);
  await unlink(path.join(UPLOAD_DIR, fileName)).catch(() => {
    // si el archivo ya no existe, no pasa nada
  });
}
