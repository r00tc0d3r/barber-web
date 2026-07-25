import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Configuración | Admin",
};

export default async function SettingsPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Configuración</h1>
      <SettingsForm />
    </div>
  );
}
