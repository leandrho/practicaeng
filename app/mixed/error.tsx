"use client";

import { Button } from "../components/ui/Button";

export default function MixedError({ retry }: { retry: () => void }) {
  return (
    <main className="status-page" id="contenido">
      <p className="status-page__eyebrow">We couldn&apos;t load mixed practice</p>
      <h1>Something went wrong.</h1>
      <p>Try again. If the problem persists, come back later.</p>
      <Button className="btn btn--primary" onClick={retry}>
        Retry
      </Button>
    </main>
  );
}
