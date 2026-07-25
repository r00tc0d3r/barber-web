"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadImage, deleteImage } from "./actions";
import type { GalleryImage } from "@/generated/prisma/client";

interface Props {
  images: GalleryImage[];
}

export function GalleryManager({ images }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      await uploadImage(formData);
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este archivo? Se borrará de la galería permanentemente.")) return;
    setDeleting(id);
    try {
      await deleteImage(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Upload form ── */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-300">
          Subir foto o video
        </h2>
        <form ref={formRef} onSubmit={handleUpload} className="flex items-end gap-4">
          <div className="flex-1">
            <input
              type="file"
              name="file"
              accept="image/*,video/mp4,video/webm"
              required
              className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            <p className="mt-1 text-xs text-neutral-600">
              Imágenes: JPG, PNG, WebP — Máx 10MB &nbsp;|&nbsp; Videos: MP4, WebM — Máx 50MB
            </p>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Subir"}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* ── Gallery grid ── */}
      {images.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <p className="text-neutral-500">Todavía no hay contenido.</p>
          <p className="mt-1 text-sm text-neutral-600">
            Subí la primera foto o video para mostrar la galería en la página.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
            >
              <div className="aspect-[4/3]">
                {img.mediaType === "VIDEO" ? (
                  <video
                    src={img.src}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Tipo badge */}
              <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                {img.mediaType === "VIDEO" ? (
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Video
                  </span>
                ) : (
                  "Foto"
                )}
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate text-xs text-neutral-300">
                  {img.alt || "sin nombre"}
                </span>
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deleting === img.id}
                  className="rounded-lg bg-red-600/80 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting === img.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
