"use client";

export default function WordFormationError({ retry }: { retry: () => void }) {
  return (
    <main className="status-page">
      <p className="status-page__eyebrow">No pudimos cargar esta sección</p>
      <h1>Algo salió mal.</h1>
      <p>Probá de nuevo. Si el problema sigue, volvé más tarde.</p>
      <button type="button" onClick={retry}>
        Reintentar
      </button>
    </main>
  );
}
