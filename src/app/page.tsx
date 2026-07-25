import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { BarberCard } from "@/components/barber-card";
import { GallerySection } from "@/components/gallery-section";

async function getData() {
  const [barbers, totalBarbers, totalServices, heroSetting, galleryImages] =
    await Promise.all([
      prisma.barber.findMany({
        where: { isActive: true },
        include: {
          services: {
            include: { service: { select: { id: true, name: true } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.barber.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.setting.findUnique({ where: { key: "heroImage" } }),
      prisma.galleryImage.findMany({ orderBy: { order: "asc" } }),
    ]);

  let heroImageUrl: string | null = null;
  if (heroSetting?.value) {
    const img = galleryImages.find((g) => g.id === heroSetting.value);
    if (img) heroImageUrl = img.src;
  }

  return { barbers, totalBarbers, totalServices, heroImageUrl, galleryImages };
}

export default async function HomePage() {
  const { barbers, totalBarbers, totalServices, heroImageUrl, galleryImages } =
    await getData();
  const session = await auth();

  const upcomingAppointments = session?.user?.id
    ? await prisma.appointment.findMany({
        where: {
          userId: session.user.id,
          date: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { barber: true, service: true },
        orderBy: { date: "asc" },
        take: 3,
      })
    : [];

  return (
    <div className="min-h-screen">
      {/* ──────────── HERO ──────────── */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        {/* Background: gradient + dot pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Hero image — right side, fades into the dark bg */}
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
          <img
            src={heroImageUrl || "https://images.unsplash.com/photo-1593702233354-259d1f794ed1?w=1400&q=80&auto=format&fit=crop"}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            {/* Brand badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-900/40 bg-blue-950/30 px-4 py-1.5 text-xs font-medium text-blue-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
              Style Dealers
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Tu estilo,
              <br />
              <span className="text-blue-500">agendado al instante</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-400">
              Elegí tu barbero, seleccioná el servicio y reservá tu turno en
              segundos. Sin vueltas, sin llamadas.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/agendar"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Agendar turno
              </Link>
              <Link
                href="#barberos"
                className="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Nuestros barberos
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 flex gap-8 sm:gap-12">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <div>
                <p className="text-3xl font-bold text-white">{totalBarbers}</p>
                <p className="text-sm text-neutral-500">Barberos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              <div>
                <p className="text-3xl font-bold text-white">{totalServices}</p>
                <p className="text-sm text-neutral-500">Servicios</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── PRÓXIMOS TURNOS ──────────── */}
      {upcomingAppointments.length > 0 && (
        <section className="border-b border-neutral-800 py-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-xl border border-blue-900/30 bg-blue-950/20 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Tus próximos turnos
                </h2>
                <Link
                  href="/perfil"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4"
                  >
                    <p className="font-medium text-white">
                      {apt.service.name}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      con {apt.barber.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {apt.date.toLocaleDateString("es-AR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      a las{" "}
                      {apt.date.toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      hs
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ──────────── GALERÍA ──────────── */}
      <GallerySection images={galleryImages} />

      {/* ──────────── BARBEROS ──────────── */}
      <section id="barberos" className="border-b border-neutral-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white">
              Conocé a tus barberos
            </h2>
            <p className="mt-2 text-neutral-400">
              Cada uno con su estilo, todos con el mismo compromiso.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── CTA FINAL ──────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Reservá online y asegurate tu horario. Sin esperas, sin vueltas.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/agendar"
              className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Reservar turno
            </Link>
            {!session?.user && (
              <Link
                href="/login?callbackUrl=/agendar"
                className="rounded-lg border border-neutral-700 px-8 py-3 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
