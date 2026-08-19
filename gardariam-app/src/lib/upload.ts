"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

/** Encoge la imagen antes de subirla: ahorra espacio y carga mucho más rápido */
async function encoger(file: File, max = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h);
    return await new Promise((res) =>
      canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.85),
    );
  } catch {
    return file; // formatos raros (heic, svg…): se sube tal cual
  }
}

/**
 * Sube una imagen del ordenador a Firebase Storage y devuelve su URL pública.
 * `carpeta` agrupa las fotos, por ejemplo "paises/ES" o "expediciones/ES/v123".
 */
export async function subirImagen(carpeta: string, file: File): Promise<string> {
  const blob = await encoger(file);
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const destino = ref(storage, `viajes/${carpeta}/${nombre}`);
  await uploadBytes(destino, blob, { contentType: "image/jpeg" });
  return getDownloadURL(destino);
}
