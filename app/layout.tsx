import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TAKOMO — From atoms to impact",
  description:
    "A forge for hardware at Aalto. A shared makerspace and community where ambitious technical projects get funded, equipped, and shipped.",
  metadataBase: new URL("https://takomo.eu"),
  openGraph: {
    title: "TAKOMO",
    description: "From atoms to impact. A makerspace for hardware development.",
    url: "https://takomo.eu",
    siteName: "TAKOMO",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
