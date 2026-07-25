"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus } from "../actions";
import { StatusBadge } from "../status-badge";
import { formatPrice } from "@/lib/format";

type Appointment = {
  id: string;
  barberId: string;
  serviceId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  date: Date;
  endTime: Date;
  status: string;
  barber: { id: string; name: string };
  service: { id: string; name: string; price: number };
};

type Barber = { id: string; name: string };

const statuses = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "No asistió" },
];

export function AppointmentManager({
  appointments,
  barbers,
  searchParams,
}: {
  appointments: Appointment[];
  barbers: Barber[];
  searchParams: { fecha?: string; barbero?: string; estado?: string };
}) {
  const router = useRouter();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(
      Object.entries({ ...searchParams, [key]: value }).filter(
        ([, v]) => v,
      ),
    );
    router.push(`/admin/turnos?${params}`);
  }

  const statusActions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Fecha</label>
          <input
            type="date"
            defaultValue={searchParams.fecha ?? ""}
            onChange={(e) => updateFilter("fecha", e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Barbero</label>
          <select
            defaultValue={searchParams.barbero ?? ""}
            onChange={(e) => updateFilter("barbero", e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Estado</label>
          <select
            defaultValue={searchParams.estado ?? ""}
            onChange={(e) => updateFilter("estado", e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {appointments.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-sm text-neutral-500">
            No se encontraron turnos
          </div>
        )}

        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-white">
                    {new Date(apt.date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" "}
                    {new Date(apt.date).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <StatusBadge status={apt.status} />
                </div>
                <p className="mt-1 text-sm font-medium text-white">
                  {apt.clientName}
                </p>
                <p className="text-xs text-neutral-500">
                  {apt.service.name} — {apt.barber.name} — {formatPrice(apt.service.price)}
                </p>
                {apt.clientPhone && (
                  <p className="text-xs text-neutral-600">{apt.clientPhone}</p>
                )}
              </div>

              {/* Actions */}
              {statusActions[apt.status]?.length > 0 && (
                <div className="flex shrink-0 gap-2">
                  {statusActions[apt.status].map((action) => (
                    <button
                      key={action}
                      onClick={async () => {
                        await updateAppointmentStatus(
                          apt.id,
                          action as AppointmentStatus,
                        );
                        router.refresh();
                      }}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800"
                    >
                      {actionLabel(action)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmar",
    IN_PROGRESS: "Iniciar",
    COMPLETED: "Completar",
    CANCELLED: "Cancelar",
    NO_SHOW: "No asistió",
  };
  return labels[action] ?? action;
}

type AppointmentStatus =
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
