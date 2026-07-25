"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // No registrar SW en desarrollo para evitar conflictos con Turbopack HMR
    if (
      "serviceWorker" in navigator &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return null;
}
