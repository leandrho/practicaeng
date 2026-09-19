import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { ViewTransition } from "react";
import { FilterDrawerProvider, HeaderFilterButton } from "./components/FilterDrawerProvider";
import { Footer } from "./components/Footer";
import { ThemeToggle } from "./components/ThemeToggle";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PracticaEng — Practice English vocabulary",
  description:
    "Practice frequent English vocabulary and structures with active recall flashcards.",
  icons: { icon: "/icon.svg" },
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
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body>
        {/* Anti-flash de tema: corre durante el parseo, antes del primer
            paint. Va primero en <body> a propósito (ver SPEC 10 paso 1). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <FilterDrawerProvider>
          <a className="skip-link" href="#contenido">
            Skip to content
          </a>
          <header className="site-header">
            <Link className="site-header__brand" href="/">
              PracticaEng
            </Link>
            <div className="site-header__actions">
              <HeaderFilterButton />
              <ThemeToggle />
            </div>
          </header>
          <ViewTransition name="page">{children}</ViewTransition>
          <Footer />
        </FilterDrawerProvider>
      </body>
    </html>
  );
}
