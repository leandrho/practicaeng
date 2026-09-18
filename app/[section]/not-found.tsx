import Link from "next/link";

export default function SectionNotFound() {
  return (
    <main className="status-page" id="contenido">
      <p className="status-page__eyebrow">Error 404</p>
      <h1>This page doesn&apos;t exist.</h1>
      <p>Go back home to pick a section and keep practicing.</p>
      <Link className="btn btn--primary" href="/">
        Go home
      </Link>
    </main>
  );
}
