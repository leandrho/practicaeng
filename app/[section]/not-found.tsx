import Link from "next/link";

export default function SectionNotFound() {
  return (
    <main className="status-page" id="contenido">
      <p className="status-page__eyebrow">Error 404</p>
      <h1>Esta página no existe.</h1>
      <p>Volvé al inicio para elegir una sección y seguir practicando.</p>
      <Link className="btn btn--primary" href="/">
        Ir al inicio
      </Link>
    </main>
  );
}
