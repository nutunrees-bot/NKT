import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[340px] rounded-2xl border border-(--line) bg-(--card) px-6 py-8 text-center shadow-[0_4px_16px_rgba(0,0,0,.06)]">
        <div className="mb-1 text-5xl">🚑</div>
        <h1 className="mb-1 text-xl font-semibold text-(--navy)">NKT Rescue</h1>
        <p className="mb-6 text-[12px] text-(--muted)">
          ER โรงพยาบาลสมเด็จพระยุพราชนครไทย
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
