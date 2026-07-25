import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import ws from "ws";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({ input, output });

async function ask(question: string, defaultValue?: string): Promise<string> {
  const defaultMsg = defaultValue ? ` (${defaultValue})` : "";
  const answer = await rl.question(`  ${question}${defaultMsg}: `);
  return answer.trim() || defaultValue || "";
}

async function main() {
  console.log("\n🚀  Barber Web — Seed\n");

  // ── Admin ───────────────────────────────────
  console.log("📋  Usuario administrador");

  const email =
    process.env.SEED_ADMIN_EMAIL || (await ask("Email", "admin@barberia.com"));
  const name =
    process.env.SEED_ADMIN_NAME || (await ask("Nombre", "Admin"));
  const password =
    process.env.SEED_ADMIN_PASSWORD || (await ask("Contraseña", "admin123"));

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`  ⚠️  Ya existe "${email}" — omitiendo`);
  } else {
    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: { email, name, password: hashedPassword, role: "ADMIN" },
    });
    console.log(`  ✅  Admin creado: ${email} / ${password}`);
  }

  // ── Servicios ───────────────────────────────
  console.log("\n📋  Servicios");

  const services = [
    { name: "Corte de pelo", duration: 30, price: 10000 },
    { name: "Arreglo de barba", duration: 20, price: 7000 },
    { name: "Corte + Barba", duration: 45, price: 15000 },
    { name: "Corte infantil", duration: 25, price: 8000 },
    { name: "Degradado", duration: 40, price: 12000 },
    { name: "Tinte", duration: 60, price: 25000 },
  ];

  for (const svc of services) {
    const existing = await prisma.service.findFirst({
      where: { name: svc.name },
    });
    if (!existing) {
      await prisma.service.create({ data: svc });
      console.log(`  ✅  "${svc.name}" — $${svc.price}`);
    } else {
      console.log(`  ⚠️  "${svc.name}" ya existe`);
    }
  }

  // ── Barberos ────────────────────────────────
  console.log("\n📋  Barberos");

  const barbers = [
    {
      name: "Juan Pérez",
      color: "#3B82F6",
      specialties: "Degradados, Cortes modernos, Barba",
      experience: 8,
      bio: "Especialista en degradados y cortes de tendencia",
    },
    {
      name: "Carlos García",
      color: "#10B981",
      specialties: "Cortes clásicos, Barba tradicional, Navaja",
      experience: 12,
      bio: "Maestro barbero con experiencia en barbería tradicional",
    },
    {
      name: "María López",
      color: "#F59E0B",
      specialties: "Tintes, Mechas, Peinados, Cortes femeninos",
      experience: 6,
      bio: "Experta en colorimetría y estilos modernos",
    },
  ];

  const allServices = await prisma.service.findMany();

  for (const barber of barbers) {
    const existing = await prisma.barber.findFirst({
      where: { name: barber.name },
    });

    if (!existing) {
      const created = await prisma.barber.create({
        data: {
          name: barber.name,
          color: barber.color,
          bio: barber.bio,
          specialties: barber.specialties,
          experience: barber.experience,
          services: {
            create: allServices.map((s) => ({ serviceId: s.id })),
          },
        },
      });
      console.log(`  ✅  "${created.name}"`);
    } else {
      console.log(`  ⚠️  "${barber.name}" ya existe`);
    }
  }

  // ── Disponibilidad ──────────────────────────
  console.log("\n📋  Disponibilidad");

  const allBarbers = await prisma.barber.findMany();
  const weekDays = [
    { day: 1, label: "Lunes" },
    { day: 2, label: "Martes" },
    { day: 3, label: "Miércoles" },
    { day: 4, label: "Jueves" },
    { day: 5, label: "Viernes" },
    { day: 6, label: "Sábado" },
  ];

  for (const barber of allBarbers) {
    for (const { day, label } of weekDays) {
      const existing = await prisma.availability.findUnique({
        where: {
          barberId_dayOfWeek: { barberId: barber.id, dayOfWeek: day },
        },
      });

      if (!existing) {
        const isSaturday = day === 6;
        await prisma.availability.create({
          data: {
            barberId: barber.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: isSaturday ? "13:00" : "18:00",
          },
        });
        console.log(
          `  ✅  ${barber.name} — ${label} 09:00-${isSaturday ? "13:00" : "18:00"}`,
        );
      }
    }
  }

  console.log("\n🎉  ¡Seed completado!\n");
}

main()
  .catch((e) => {
    console.error("\n❌  Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
