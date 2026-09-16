import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadados globais do app (aba do navegador, SEO e apresentação do TCC).
export const metadata: Metadata = {
  title: "Fontes Mobilidade B2B",
  description: "Pedidos em lote de bicicletas elétricas para lojistas parceiros.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Navbar global preto+amarela (server component — Navbar é client) */}
        <Navbar />
        {/*
          Padding inferior reserva espaço para o rodapé FIXO da tela de novo
          pedido: no mobile o rodapé empilha (contagem+total em cima, botão
          abaixo) e precisa de ~160px (pb-40); em ≥640px é 1 linha (pb-28).
          Páginas sem rodapé fixo apenas ganham respiro — inofensivo.
        */}
        <main className="mx-auto w-full max-w-5xl px-4 pb-40 sm:pb-28">{children}</main>
        {/*
          Toaster global do react-hot-toast: top-center para os toasts ficarem
          visíveis no vídeo mesmo em telas mobile pequenas.
        */}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
