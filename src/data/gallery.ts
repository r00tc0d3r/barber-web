export interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Hace que la imagen ocupe 2 columnas en desktop */
  featured?: boolean;
}

/**
 * Galería de imágenes — reemplazá las URLs de Unsplash por tus fotos reales
 * cuando las tengas. Podés ponerlas en /public/images/gallery/ y usar rutas
 * relativas: src="/images/gallery/mi-foto.jpg"
 *
 * Para usar imágenes locales:
 *   1. Creá /public/images/gallery/
 *   2. Poné tus fotos ahí
 *   3. Cambiá src por "/images/gallery/tu-foto.jpg"
 */
export const galleryImages: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1770253980732-dfed1cfdfa43?w=800&q=80&auto=format&fit=crop",
    alt: "Barbero trabajando con máquina",
    width: 800,
    height: 1000,
  },
  {
    src: "https://images.unsplash.com/photo-1593702233354-259d1f794ed1?w=800&q=80&auto=format&fit=crop",
    alt: "Corte clásico en barbería",
    width: 800,
    height: 600,
    featured: true,
  },
  {
    src: "https://images.unsplash.com/photo-1761931403671-d020a14928d9?w=800&q=80&auto=format&fit=crop",
    alt: "Barbero con tijeras y peine",
    width: 800,
    height: 1000,
  },
  {
    src: "https://images.unsplash.com/photo-1747832802200-7aaceb517e0c?w=800&q=80&auto=format&fit=crop",
    alt: "Barbero dando un corte moderno",
    width: 800,
    height: 800,
  },
];
