import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";
import {
  isAllowlistedAdminEmail,
  isDiscordGateConfigured,
} from "@/lib/discord-gate";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 pb-20 pt-28 text-center">
        <h1 className="text-2xl text-snow">Auth not configured</h1>
        <p className="mt-2 text-sm text-cloud">
          Add <code className="text-snow">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-snow">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
          Vercel (or <code className="text-snow">.env.local</code>), then
          redeploy.
        </p>
      </div>
    );
  }

  const user = await getSessionUser();
  if (user) {
    if (
      isDiscordGateConfigured() &&
      !isAllowlistedAdminEmail(user.email) &&
      user.app_metadata?.discord_verified !== true
    ) {
      redirect(
        `/join-discord?next=${encodeURIComponent(next === "/login" ? "/" : next)}`,
      );
    }
    redirect(next);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 pb-16 pt-24">
      <LoginForm nextPath={next} initialMode={initialMode} />
    </div>
  );
}
