import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Outfit } from "next/font/google";
import { auth } from "@/auth";
import { AuthSessionProvider } from "@/components/session-provider";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Anikura",
    template: "%s — Anikura",
  },
  description:
    "A quiet theater for loud stories — sakura glow, soft nights, and the next episode waiting when you are.",
  icons: {
    icon: "/anikura-mark.png",
    apple: "/anikura-mark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${outfit.variable} ${noto.variable} antialiased`}>
        <AuthSessionProvider session={session}>
          <div className="site-atmosphere">
            <SiteAtmosphere />
          </div>
          <div className="noise" aria-hidden />
          <SiteHeader />
          <main className="relative z-10 min-h-screen">{children}</main>
          <SiteFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
