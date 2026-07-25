"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { requireAuth } from "@/lib/auth-guard";
import { updateImageOrderSchema } from "@/lib/validations";

// ── Magic bytes for file type verification ────────────────

const MAGIC_BYTES: Record<string, number[]> = {
	"image/jpeg": [0xff, 0xd8, 0xff],
	"image/png": [0x89, 0x50, 0x4e, 0x47],
	"image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF container
	"video/mp4": [0x00, 0x00, 0x00], // ftyp box at offset 4
	"video/webm": [0x1a, 0x45, 0xdf, 0xa3],
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MAGIC_BYTES));

function validateMagicBytes(buffer: Buffer, declaredType: string): boolean {
	const expected = MAGIC_BYTES[declaredType];
	if (!expected) return false;
	return expected.every((byte, i) => buffer[i] === byte);
}

// ── Actions ──────────────────────────────────────────────

export async function getGalleryImages() {
	return prisma.galleryImage.findMany({
		orderBy: { order: "asc" },
	});
}

export async function uploadImage(formData: FormData) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);

	const file = formData.get("file") as File;
	if (!file || file.size === 0)
		throw new Error("No se seleccionó ningún archivo");

	// Validate MIME type against allowlist
	if (!ALLOWED_MIME_TYPES.has(file.type)) {
		throw new Error(
			"Solo se permiten imágenes (JPG, PNG, WebP) o videos (MP4, WebM)",
		);
	}

	// Validate file size
	const isVideo = file.type.startsWith("video/");
	const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
	if (file.size > maxSize) {
		throw new Error(
			`El archivo no puede superar los ${isVideo ? "50MB" : "10MB"}`,
		);
	}

	// Read buffer and validate magic bytes (prevents .exe renamed to .jpg)
	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);

	if (!validateMagicBytes(buffer, file.type)) {
		throw new Error(
			"El contenido del archivo no coincide con el tipo declarado",
		);
	}

	// Generate unique filename
	const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
	const fileName = `${crypto.randomUUID()}.${ext}`;
	const filePath = join(process.cwd(), "public/images/gallery", fileName);

	await writeFile(filePath, buffer);

	// Get highest order to append at end
	const last = await prisma.galleryImage.findFirst({
		orderBy: { order: "desc" },
	});

	await prisma.galleryImage.create({
		data: {
			src: `/images/gallery/${fileName}`,
			alt: file.name.replace(/\.[^/.]+$/, ""),
			mediaType: isVideo ? "VIDEO" : "IMAGE",
			order: (last?.order ?? -1) + 1,
		},
	});

	revalidatePath("/admin/galeria");
}

export async function deleteImage(id: string) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);

	const image = await prisma.galleryImage.findUnique({ where: { id } });
	if (!image) throw new Error("Imagen no encontrada");

	// Delete physical file (only local files, not external URLs)
	if (!image.src.startsWith("http")) {
		const filePath = join(process.cwd(), "public", image.src);
		try {
			await unlink(filePath);
		} catch {
			// File already gone — not a problem
		}
	}

	await prisma.galleryImage.delete({ where: { id } });
	revalidatePath("/admin/galeria");
	revalidatePath("/admin/settings");
}

export async function updateImageOrder(data: unknown) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);
	const parsed = updateImageOrderSchema.parse(data);

	for (const { id, order } of parsed.updates) {
		await prisma.galleryImage.update({ where: { id }, data: { order } });
	}

	revalidatePath("/admin/galeria");
}
