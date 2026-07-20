export type PublicProfile = {
  id: string;
  email: string | null;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  role?: "user" | "admin";
};

export function displayName(profile: Pick<PublicProfile, "nickname" | "email">) {
  return (
    profile.nickname?.trim() ||
    profile.email?.split("@")[0] ||
    "Viewer"
  );
}
