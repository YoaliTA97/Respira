import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/lib/store";
import { DemoBar } from "@/components/DemoBar";
import { ToastView } from "@/components/ui";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Respira · demo",
  description: "La red que cuida a quien cuida. Demo de la app para la red familiar, con su capa técnica.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-ink">
        <DemoProvider>
          <DemoBar />
          <div className="flex flex-1 flex-col">{children}</div>
          <ToastView />
        </DemoProvider>
      </body>
    </html>
  );
}
