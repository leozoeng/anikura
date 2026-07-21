import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-ghibli",
  display: "swap",
});

export default function GhibliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fraunces.variable} ghibli-world`}>{children}</div>;
}
