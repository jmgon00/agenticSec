import type { Metadata } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/content/config";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "AgenticSec - Análisis de Seguridad & Automatización IA",
  description: "Servicios profesionales de análisis de vulnerabilidades, auditorías y automatización con agentes de IA",
  authors: [{ name: "Juan Mago González", url: "https://agenticsec.vercel.app" }],
  openGraph: {
    title: "AgenticSec",
    description: "Análisis de vulnerabilidades, auditorías y automatización inteligente",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "AgenticSec",
    description: "Análisis de vulnerabilidades, auditorías y automatización inteligente",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          html, body { margin: 0; padding: 0; }
          body { background-color: #0a0e27; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          * { box-sizing: border-box; }
        `}} />
      </head>
      <body className="bg-gray-900 text-white">
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
