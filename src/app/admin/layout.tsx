import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "CLIENT") redirect("/login");

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/turnos", label: "Turnos" },
    { href: "/admin/barberos", label: "Barberos" },
    { href: "/admin/servicios", label: "Servicios" },
    { href: "/admin/calendar", label: "Calendar" },
    { href: "/admin/galeria", label: "Galería" },
    { href: "/admin/settings", label: "Configuración" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-neutral-800 bg-neutral-950 p-4 sm:block">
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="mt-auto border-t border-neutral-800 pt-4">
          <Link
            href="/"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Volver al sitio
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-800 px-4 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/"
          className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          Sitio
        </Link>
        <LogoutButton label="Salir" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </div>
    </div>
  );
}
