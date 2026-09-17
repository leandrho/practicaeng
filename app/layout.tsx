import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PracticaEng — Practicá vocabulario en inglés",
  description:
    "Aplicación para practicar vocabulario y estructuras frecuentes del inglés con tarjetas de active recall.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
