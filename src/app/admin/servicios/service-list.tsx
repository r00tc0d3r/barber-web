"use client";

import { useState } from "react";
import { createService, updateService, deleteService } from "../actions";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
};

function ServiceForm({
  service,
  onDone,
}: {
  service?: Service | null;
  onDone: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [duration, setDuration] = useState(service?.duration ?? 30);
  const [price, setPrice] = useState(service?.price ?? 0);
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (service) {
        await updateService(service.id, {
          name,
          description: description || undefined,
          duration,
          price,
          isActive,
        });
      } else {
        await createService({
          name,
          description: description || undefined,
          duration,
          price,
        });
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-neutral-400">Nombre</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-400">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">
            Duración (min)
          </label>
          <input
            type="number"
            required
            min={5}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">
            Precio ($)
          </label>
          <input
            type="number"
            required
            min={0}
            step={0.5}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      {service && (
        <div>
          <label className="block text-sm text-neutral-400">Estado</label>
          <select
            value={isActive ? "active" : "inactive"}
            onChange={(e) => setIsActive(e.target.value === "active")}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : service ? "Guardar cambios" : "Crear servicio"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ServiceList({ services }: { services: Service[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    await deleteService(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Nuevo servicio
        </button>
      )}

      {creating && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h3 className="mb-4 font-medium text-white">Nuevo servicio</h3>
          <ServiceForm
            onDone={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {services.map((svc) => (
        <div
          key={svc.id}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          {editingId === svc.id ? (
            <div>
              <h3 className="mb-4 font-medium text-white">
                Editando: {svc.name}
              </h3>
              <ServiceForm
                service={svc}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-white">{svc.name}</h3>
                <p className="text-xs text-neutral-500">
                  {formatPrice(svc.price)} — {svc.duration} min
                  {!svc.isActive && (
                    <span className="ml-2 text-red-400">Inactivo</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(svc.id)}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(svc.id)}
                  className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-950"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
