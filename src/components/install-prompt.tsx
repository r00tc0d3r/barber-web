"use client";

import { useState, useEffect } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<Event | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShow(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;

    if (result.outcome === "accepted") {
      setShow(false);
    }

    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              Instalá Style Dealers
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Accedé rápido desde tu pantalla de inicio
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShow(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:text-white"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Instalar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
