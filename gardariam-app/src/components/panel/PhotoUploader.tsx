"use client";

import { useRef, useState } from "react";
import { subirImagen } from "@/lib/upload";

interface Props {
  /** carpeta en la que se guardan, p.ej. "paises/ES" */
  carpeta: string;
  /** se llama con la URL de cada foto subida */
  onSubida: (urls: string[]) => void;
  multiple?: boolean;
  etiqueta?: string;
}

/** Botón para subir fotos desde el ordenador o el móvil (solo admin) */
export default function PhotoUploader({
  carpeta,
  onSubida,
  multiple = false,
  etiqueta = "Subir foto",
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState("");

  async function elegidas(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    setError(null);
    const urls: string[] = [];
    try {
      const lista = Array.from(files);
      for (let i = 0; i < lista.length; i++) {
        setProgreso(lista.length > 1 ? `${i + 1}/${lista.length}` : "");
        urls.push(await subirImagen(carpeta, lista[i]));
      }
      onSubida(urls);
    } catch {
      setError("No se pudo subir. Revisa la conexión o los permisos.");
    }
    setProgreso("");
    setSubiendo(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="uploader">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => elegidas(e.target.files)}
      />
      <button
        type="button"
        className="uploader-btn"
        disabled={subiendo}
        onClick={() => input.current?.click()}
      >
        {subiendo ? `Subiendo… ${progreso}` : `⬆ ${etiqueta}`}
      </button>
      {error && <span className="uploader-error">{error}</span>}
    </div>
  );
}
