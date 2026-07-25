"use client";

import { useState, useEffect } from "react";

type PushState = "loading" | "unsupported" | "denied" | "inactive" | "active";

export function PushSubscriber() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "active" : "inactive");
    } catch {
      setState("inactive");
    }
  }

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        });
      }

      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setState("active");
    } catch (err) {
      console.error("Error subscribing to push:", err);
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setState("inactive");
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">
            Recordatorios de turnos
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Recibí notificaciones antes de tus turnos
          </p>
        </div>
        <button
          onClick={state === "active" ? unsubscribe : subscribe}
          className={`relative inline-flex h-7 w-11 cursor-pointer items-center rounded-full transition-colors ${
            state === "active"
              ? "bg-blue-600"
              : state === "denied"
                ? "bg-neutral-700 opacity-50"
                : "bg-neutral-700"
          }`}
          disabled={state === "denied"}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              state === "active" ? "translate-x-[22px]" : "translate-x-[2px]"
            }`}
          />
        </button>
      </div>
      {state === "denied" && (
        <p className="mt-2 text-xs text-amber-500">
          Bloqueaste las notificaciones. Podés habilitarlas desde la
          configuración del navegador.
        </p>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
