"use client";

import { useState } from "react";
import { createBarber, updateBarber, deleteBarber } from "../actions";
import { useRouter } from "next/navigation";

type Barber = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  specialties: string | null;
  experience: number | null;
  instagram: string | null;
  color: string;
  isActive: boolean;
  services: { service: { id: string; name: string } }[];
};

type Service = { id: string; name: string };

function BarberForm({
  barber,
  services,
  onDone,
}: {
  barber?: Barber | null;
  services: Service[];
  onDone: () => void;
}) {
  const [name, setName] = useState(barber?.name ?? "");
  const [email, setEmail] = useState(barber?.email ?? "");
  const [phone, setPhone] = useState(barber?.phone ?? "");
  const [bio, setBio] = useState(barber?.bio ?? "");
  const [specialties, setSpecialties] = useState(barber?.specialties ?? "");
  const [experience, setExperience] = useState(String(barber?.experience ?? ""));
  const [instagram, setInstagram] = useState(barber?.instagram ?? "");
  const [color, setColor] = useState(barber?.color ?? "#3B82F6");
  const [isActive, setIsActive] = useState(barber?.isActive ?? true);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    barber?.services.map((s) => s.service.id) ?? [],
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (barber) {
        await updateBarber(barber.id, {
          name,
          email: email || undefined,
          phone: phone || undefined,
          bio: bio || undefined,
          specialties: specialties || undefined,
          experience: experience ? Number(experience) : undefined,
          instagram: instagram || undefined,
          color,
          isActive,
          serviceIds: selectedServices,
        });
      } else {
        await createBarber({
          name,
          email: email || undefined,
          phone: phone || undefined,
          bio: bio || undefined,
          specialties: specialties || undefined,
          experience: experience ? Number(experience) : undefined,
          instagram: instagram || undefined,
          color,
          serviceIds: selectedServices,
        });
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Teléfono</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-neutral-400">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">
            Especialidades
          </label>
          <input
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="Degradados, Barba, Cortes clásicos"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">
            Años de experiencia
          </label>
          <input
            type="number"
            min={0}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="5"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Instagram</label>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@usuario"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-neutral-700 bg-neutral-950"
          />
        </div>
        {barber && (
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
      </div>
      <div>
        <label className="mb-2 block text-sm text-neutral-400">Servicios</label>
        <div className="flex flex-wrap gap-2">
          {services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => toggleService(svc.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedServices.includes(svc.id)
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {svc.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : barber ? "Guardar cambios" : "Crear barbero"}
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

export function BarberList({
  barbers,
  services,
}: {
  barbers: Barber[];
  services: Service[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este barbero?")) return;
    await deleteBarber(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Nuevo barbero
        </button>
      )}

      {creating && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h3 className="mb-4 font-medium text-white">Nuevo barbero</h3>
          <BarberForm
            services={services}
            onDone={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {barbers.map((barber) => (
        <div
          key={barber.id}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          {editingId === barber.id ? (
            <div>
              <h3 className="mb-4 font-medium text-white">
                Editando: {barber.name}
              </h3>
              <BarberForm
                barber={barber}
                services={services}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: barber.color }}
                >
                  {barber.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-white">{barber.name}</h3>
                  <p className="text-xs text-neutral-500">
                    {barber.services.length} servicios
                    {!barber.isActive && (
                      <span className="ml-2 text-red-400">Inactivo</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(barber.id)}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(barber.id)}
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
