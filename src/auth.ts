import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

const DISCORD_INVITE = "https://discord.gg/cm72gXTASn";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      authorization: {
        params: {
          scope: "identify email",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url === DISCORD_INVITE || url.startsWith("https://discord.gg/")) {
        return DISCORD_INVITE;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        const discordId =
          "id" in profile && typeof profile.id === "string"
            ? profile.id
            : undefined;
        if (discordId) {
          token.discordId = discordId;
        }
        const username =
          "username" in profile && typeof profile.username === "string"
            ? profile.username
            : undefined;
        if (username) {
          token.discordUsername = username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.discordId === "string") {
          session.user.id = token.discordId;
        }
        if (typeof token.discordUsername === "string") {
          session.user.discordUsername = token.discordUsername;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
