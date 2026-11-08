import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Outfit } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/db";
import { Aviso } from "@/components/ui";
import { DemoAuto } from "@/components/DemoAuto";

// Outfit para títulos y cifras; Atkinson Hyperlegible (diseñada para baja visión) para leer.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["500", "600", "700"] });
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Respira",
  description: "Turnarse también es cuidar: red familiar, relevos, alertas y certificación para cuidadoras.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: algunas extensiones del navegador agregan atributos a <html>/<body>
    // antes de que cargue React; el contenido de la app se dibuja solo en el cliente (DataProvider).
    <html lang="es" className={`${outfit.variable} ${atkinson.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-canvas font-sans text-ink" suppressHydrationWarning>
        <DataProvider>
          {children}
          <Aviso />
          <DemoAuto />
        </DataProvider>
      </body>
    </html>
  );
}
