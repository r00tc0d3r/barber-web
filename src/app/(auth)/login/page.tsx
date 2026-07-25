import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/perfil");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Barber<span className="text-blue-500">Web</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Iniciá sesión para agendar tu turno
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
