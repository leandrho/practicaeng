import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status-page">
      <p className="status-page__eyebrow">Error 404</p>
      <h1>Esta página no existe.</h1>
      <p>Volvé al inicio para elegir una sección y seguir practicando.</p>
      <Link href="/">Ir al inicio</Link>
    </main>
  );
}
