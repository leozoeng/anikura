import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { joinDiscordGuild } from "@/lib/discord-guild";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      // identify + guilds.join so we can add the user to the Anikura server
      authorization: {
        params: {
          scope: "identify email guilds.join",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
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
  events: {
    async signIn({ account, profile }) {
      if (
        account?.provider !== "discord" ||
        !account.access_token ||
        !profile ||
        !("id" in profile) ||
        typeof profile.id !== "string"
      ) {
        return;
      }
      // Fire-and-forget: never block sign-in if Discord join fails
      void joinDiscordGuild(profile.id, account.access_token);
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
