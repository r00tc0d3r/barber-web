import Link from "next/link";
import { auth } from "@/lib/auth";
import { MobileMenu } from "./mobile-menu";

export async function Navbar() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdmin = !!session?.user?.role && session.user.role !== "CLIENT";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg className="hidden h-6 w-6 text-blue-500 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-white">
            Style<span className="text-blue-500"> Dealers</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 sm:flex">
          {isLoggedIn && (
            <Link
              href="/agendar"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Agendar turno
            </Link>
          )}
          {isLoggedIn && (
            <Link
              href="/perfil"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Mis turnos
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-amber-700 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-950"
            >
              Admin
            </Link>
          )}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile menu */}
        <MobileMenu
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          userEmail={session?.user?.email ?? null}
        />
      </nav>
    </header>
  );
}
