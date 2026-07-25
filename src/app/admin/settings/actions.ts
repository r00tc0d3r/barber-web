"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

// ── Settings genéricos (key-value) ──

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function updateSetting(key: string, value: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "CLIENT") throw new Error("No autorizado");

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/admin/settings");
}

export async function saveSettings(data: Record<string, string>) {
  const session = await auth();
  if (!session?.user || session.user.role === "CLIENT") throw new Error("No autorizado");

  for (const [key, value] of Object.entries(data)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

// ── Galería (re-export para settings) ──

export async function getGalleryImages() {
  return prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
  });
}
