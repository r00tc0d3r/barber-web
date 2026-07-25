"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userEmail: string | null;
};

export function MobileMenu({ isLoggedIn, isAdmin, userEmail }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800"
        aria-label="Menú"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-neutral-800 bg-neutral-950 px-4 pb-6 pt-2">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Inicio
            </Link>

            {isLoggedIn && (
              <Link
                href="/agendar"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Agendar turno
              </Link>
            )}

            {isLoggedIn && (
              <Link
                href="/perfil"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Mis turnos
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-950"
              >
                Panel admin
              </Link>
            )}

            {isLoggedIn && userEmail && (
              <div className="mt-2 border-t border-neutral-800 pt-2">
                <p className="px-3 text-xs text-neutral-600">{userEmail}</p>
              </div>
            )}

            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
