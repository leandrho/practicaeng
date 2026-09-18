"use client";

import { Button } from "../components/ui/Button";

export default function WordFormationError({ retry }: { retry: () => void }) {
  return (
    <main className="status-page" id="contenido">
      <p className="status-page__eyebrow">No pudimos cargar esta sección</p>
      <h1>Algo salió mal.</h1>
      <p>Probá de nuevo. Si el problema sigue, volvé más tarde.</p>
      <Button className="btn btn--primary" onClick={retry}>
        Reintentar
      </Button>
    </main>
  );
}
