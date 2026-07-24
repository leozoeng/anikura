import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";
import {
  hasStaleDiscordBypass,
  isDiscordGateConfigured,
  skipsDiscordGate,
} from "@/lib/discord-gate";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Enter",
  description:
    "Members-only access to Anikura — create an account and join Discord to unlock the theater.",
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
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 text-center">
        <h1 className="text-2xl text-snow">Auth not configured</h1>
        <p className="mt-2 text-sm text-cloud">
          Add <code className="text-snow">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-snow">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
          Vercel, then redeploy.
        </p>
      </div>
    );
  }

  const user = await getSessionUser();
  if (user) {
    const appMeta = user.app_metadata as Record<string, unknown> | undefined;
    const needsDiscord =
      isDiscordGateConfigured() &&
      !skipsDiscordGate(user.email) &&
      (user.app_metadata?.discord_verified !== true ||
        hasStaleDiscordBypass(user.email, appMeta));
    if (needsDiscord) {
      redirect(
        `/join-discord?next=${encodeURIComponent(next === "/login" ? "/" : next)}`,
      );
    }
    redirect(next);
  }

  return <LoginForm nextPath={next} initialMode={initialMode} />;
}
