import type { Metadata } from "next";
import { Montserrat, Doppio_One, Overpass } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const base = Montserrat({ subsets: ["latin"], variable: "--font-base" });
const doppio = Doppio_One({ subsets: ["latin"], weight: "400", variable: "--font-mono" });
const display = Overpass({ subsets: ["latin"], variable: "--font-display" });

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
      <body className={`${base.variable} ${doppio.variable} ${display.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
