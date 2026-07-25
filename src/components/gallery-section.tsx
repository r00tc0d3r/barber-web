"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { galleryImages as fallbackImages } from "@/data/gallery";

export interface GalleryImageData {
  id?: string;
  src: string;
  alt: string;
  mediaType?: string; // "IMAGE" | "VIDEO"
  /** Ancho real en px (opcional, solo para hardcoded) */
  width?: number;
  /** Alto real en px (opcional, solo para hardcoded) */
  height?: number;
  /** Ocupa 2 columnas en desktop (solo hardcoded) */
  featured?: boolean;
}

interface Props {
  /** Imágenes desde la DB. Si no hay, usa las hardcodeadas. */
  images?: GalleryImageData[];
}

export function GallerySection({ images }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Usar DB images si existen, sino fallback hardcoded
  const gallery =
    images && images.length > 0
      ? images.map((img) => ({
          src: img.src,
          alt: img.alt,
          mediaType: img.mediaType ?? "IMAGE",
          width: img.width ?? 4,
          height: img.height ?? 3,
          featured: img.featured ?? false,
          isDb: !img.width,
        }))
      : fallbackImages.map((img) => ({
          src: img.src,
          alt: img.alt,
          mediaType: "IMAGE",
          width: img.width,
          height: img.height,
          featured: img.featured ?? false,
          isDb: false,
        }));

  const current = selected !== null ? gallery[selected] : null;

  const open = useCallback((idx: number) => setSelected(idx), []);
  const close = useCallback(() => setSelected(null), []);
  const prev = useCallback(
    () =>
      setSelected((s) =>
        s !== null ? (s - 1 + gallery.length) % gallery.length : null,
      ),
    [],
  );
  const next = useCallback(
    () =>
      setSelected((s) =>
        s !== null ? (s + 1) % gallery.length : null,
      ),
    [],
  );

  /* ── Pausar video al cambiar slide ── */
  useEffect(() => {
    if (selected !== null) {
      // Pequeño timeout para que el DOM se actualice
      const t = setTimeout(() => {
        videoRef.current?.load();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [selected]);

  /* ── keyboard ── */
  useEffect(() => {
    if (selected === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [selected, close, prev, next]);

  if (gallery.length === 0) return null;

  return (
    <section className="border-b border-neutral-800 py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* ── Header ── */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white">Galería</h2>
          <p className="mt-2 text-neutral-400">
            El estilo que hacemos, en imágenes.
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, idx) => (
            <button
              key={idx}
              onClick={() => open(idx)}
              className={`group relative overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                item.featured ? "lg:col-span-2" : ""
              }`}
            >
              <div
                className="relative w-full"
                style={{
                  aspectRatio: item.isDb
                    ? "4 / 3"
                    : `${item.width} / ${item.height}`,
                }}
              >
                {item.mediaType === "VIDEO" ? (
                  <>
                    <video
                      src={item.src}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                    />
                    {/* Play icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <svg
                          className="ml-1 h-7 w-7 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Hover overlay (solo imágenes) */}
              {item.mediaType !== "VIDEO" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
                  <svg
                    className="h-10 w-10 scale-50 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {selected !== null && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Anterior"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {current.mediaType === "VIDEO" ? (
            <video
              ref={videoRef}
              src={current.src}
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
              controls
              autoPlay
              loop
              muted
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={current.src}
              alt={current.alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
          )}

          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Siguiente"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-4 text-sm text-neutral-400">
            {selected + 1} / {gallery.length}
            {current.mediaType === "VIDEO" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Video
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
