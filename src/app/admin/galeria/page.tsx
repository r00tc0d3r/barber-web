import { GalleryManager } from "./gallery-manager";
import { getGalleryImages } from "./actions";

export const metadata = {
  title: "Galería | Admin",
};

export default async function GaleriaPage() {
  const images = await getGalleryImages();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Galería</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Subí las fotos de los trabajos para mostrarlas en la página principal.
      </p>
      <GalleryManager images={images} />
    </div>
  );
}
