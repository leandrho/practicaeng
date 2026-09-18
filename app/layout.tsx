import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "./components/ThemeToggle";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PracticaEng — Practicá vocabulario en inglés",
  description:
    "Aplicación para practicar vocabulario y estructuras frecuentes del inglés con tarjetas de active recall.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const THEME_STORAGE_KEY = "practicaeng:theme:v1";

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var v=null;try{v=localStorage.getItem(k)}catch(e){}var t=(v==="light"||v==="dark")?v:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <header className="site-header">
          <Link className="site-header__brand" href="/">
            PracticaEng
          </Link>
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
