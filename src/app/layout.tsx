import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Outfit } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/db";
import { Aviso } from "@/components/ui";

// Outfit para títulos y cifras; Atkinson Hyperlegible (diseñada para baja visión) para leer.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["500", "600", "700"] });
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Respira",
  description: "Turnarse también es cuidar: red familiar, relevos, alertas y certificación para cuidadoras.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${atkinson.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans text-ink">
        <DataProvider>
          {children}
          <Aviso />
        </DataProvider>
      </body>
    </html>
  );
}
