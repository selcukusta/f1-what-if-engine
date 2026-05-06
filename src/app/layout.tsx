import type { Metadata } from "next";
import { Orbitron, Chakra_Petch } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "F1 What-If Engine",
  description: "Change strategy, change the race outcome.",
  metadataBase: new URL("https://f1whatif.vercel.app"),
  openGraph: {
    title: "F1 What-If Engine",
    description: "Change strategy, change the race outcome.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${chakraPetch.variable}`}>
      <body className="font-body antialiased min-h-screen">{children}</body>
    </html>
  );
}
