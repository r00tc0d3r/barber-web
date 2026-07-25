import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Calendar | Admin",
};

export default async function CalendarPage() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;

  const appointmentsWithEvents = await prisma.appointment.count({
    where: { googleCalendarEventId: { not: null } },
  });

  const totalAppointments = await prisma.appointment.count();

  const isConfigured = !!(calendarId && saEmail && hasKey);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        Google Calendar
      </h1>

      {/* Estado */}
      <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              isConfigured ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          <div>
            <p className="text-sm font-medium text-white">
              {isConfigured
                ? "Google Calendar conectado"
                : "No configurado"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {isConfigured
                ? "Los turnos se sincronizan automáticamente"
                : "Configurá las credenciales para activar la sincronización"}
            </p>
          </div>
        </div>

        {isConfigured && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
            <div>
              <p className="text-xs text-neutral-500">Calendar ID</p>
              <p className="mt-0.5 text-sm font-mono text-neutral-300 truncate"
                title={calendarId}
              >
                {calendarId}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Service Account</p>
              <p className="mt-0.5 text-sm font-mono text-neutral-300 truncate"
                title={saEmail}
              >
                {saEmail}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Turnos sincronizados</p>
              <p className="mt-0.5 text-sm text-neutral-300">
                {appointmentsWithEvents} / {totalAppointments}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Cómo configurar
        </h2>
        <ol className="ml-4 list-decimal space-y-3 text-sm text-neutral-400">
          <li>
            Andá a{" "}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Google Cloud Console
            </a>{" "}
            y creá un proyecto nuevo.
          </li>
          <li>
            Habilitá la{" "}
            <strong className="text-white">Google Calendar API</strong> desde
            Library.
          </li>
          <li>
            Andá a IAM & Admin →{" "}
            <strong className="text-white">Service Accounts</strong> y creá una
            cuenta de servicio.
          </li>
          <li>
            Descargá la clave JSON y copiá el email y la private key en el{" "}
            <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-200">
              .env
            </code>.
          </li>
          <li>
            Andá a{" "}
            <a
              href="https://calendar.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Google Calendar
            </a>
            , creá un calendario nuevo o usá uno existente.
          </li>
          <li>
            Compartí el calendario con el email del Service Account (permiso{" "}
            <strong className="text-white">Hacer cambios</strong>).
          </li>
          <li>
            Copiá el{" "}
            <strong className="text-white">Calendar ID</strong> desde Ajustes
            del calendario → Integrar calendario → ID del calendario.
          </li>
        </ol>

        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <p className="mb-2 text-xs text-neutral-500">
            Variables de entorno necesarias:
          </p>
          <pre className="overflow-x-auto text-xs text-green-400">
            {`# .env
GOOGLE_CALENDAR_ID="tucalendario@group.calendar.google.com"
GOOGLE_SERVICE_ACCOUNT_EMAIL="tu-sa@tu-proyecto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----\\n"`}
          </pre>
        </div>
      </div>
    </div>
  );
}
