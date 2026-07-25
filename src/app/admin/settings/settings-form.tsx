"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllSettings, saveSettings, getGalleryImages } from "./actions";
import { useRouter } from "next/navigation";
import type { GalleryImage } from "@/generated/prisma/client";

export function SettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([getAllSettings(), getGalleryImages()]).then(
      ([settingsData, imagesData]) => {
        setSettings(settingsData);
        setGalleryImages(imagesData);
        setLoading(false);
      },
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveSettings(settings);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-sm text-neutral-500">
        Cargando...
      </div>
    );
  }

  const currentHeroId = settings["heroImage"] ?? "";

  const fields = [
    {
      key: "instagram",
      label: "Instagram de la barbería",
      placeholder: "@styledealers",
      description: "Aparece en el footer y en la página principal",
    },
    {
      key: "phone",
      label: "Teléfono de contacto",
      placeholder: "11 1234 5678",
      description: "Teléfono para consultas",
    },
    {
      key: "address",
      label: "Dirección",
      placeholder: "Av. Siempre Viva 123",
      description: "Dirección del local",
    },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Información del local ── */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-6 text-sm font-semibold text-neutral-300">
          Información del local
        </h2>
        <div className="space-y-6">
          {fields.map(({ key, label, placeholder, description }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-neutral-300">
                {label}
              </label>
              <p className="mb-2 text-xs text-neutral-600">{description}</p>
              <input
                value={settings[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero image ── */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-300">
          Imagen de portada
        </h2>
        <p className="mb-6 text-xs text-neutral-600">
          Seleccioná la foto que aparece como fondo en la parte principal de la
          home.
        </p>

        {galleryImages.filter((img) => img.mediaType === "IMAGE").length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-500">
            No hay imágenes en la galería.{" "}
            <a
              href="/admin/galeria"
              className="text-blue-400 hover:text-blue-300"
            >
              Subí algunas fotos primero
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {/* Opción: sin imagen */}
            <button
              type="button"
              onClick={() => update("heroImage", "")}
              className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 ${
                currentHeroId === ""
                  ? "border-blue-500"
                  : "border-neutral-700 hover:border-neutral-600"
              } bg-neutral-800 transition-colors`}
            >
              <div className="flex h-full items-center justify-center">
                <svg
                  className="h-6 w-6 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              {currentHeroId === "" && (
                <div className="absolute inset-x-0 bottom-0 bg-blue-500 py-1 text-center text-[10px] font-medium text-white">
                  Seleccionada
                </div>
              )}
            </button>

            {galleryImages
              .filter((img) => img.mediaType === "IMAGE")
              .map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => update("heroImage", img.id)}
                className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 ${
                  currentHeroId === img.id
                    ? "border-blue-500"
                    : "border-neutral-700 hover:border-neutral-600"
                } transition-colors`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-cover"
                />
                {currentHeroId === img.id && (
                  <div className="absolute inset-x-0 bottom-0 bg-blue-500 py-1 text-center text-[10px] font-medium text-white">
                    Seleccionada
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && (
          <span className="text-sm text-green-400">✓ Guardado</span>
        )}
      </div>
    </form>
  );
}
