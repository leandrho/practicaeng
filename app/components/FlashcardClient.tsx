"use client";

import { useEffect, useState } from "react";
import { init, next, prev, reveal } from "../../src/application/session";
import type { Card } from "../../src/domain/card";

type FlashcardClientProps = {
  cards: Card[];
};

export default function FlashcardClient({ cards }: FlashcardClientProps) {
  const [session, setSession] = useState(() => init(cards));
  const card = session.current;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          setSession(prev);
          break;
        case "ArrowRight":
          event.preventDefault();
          setSession(next);
          break;
        case " ":
          event.preventDefault();
          setSession(reveal);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (card === null) {
    return <p className="flashcard-empty">No hay tarjetas disponibles.</p>;
  }

  return (
    <section className="flashcard">
      <h1>{card.expression}</h1>
      {session.revealed ? (
        <div className="flashcard__answer" aria-live="polite">
          <p>
            <strong>Significado:</strong> {card.meaningEs}
          </p>
          <p>
            <strong>Ejemplo:</strong> {card.exampleEn}
          </p>
          {card.translationEs === undefined ? null : (
            <p>
              <strong>Traducción:</strong> {card.translationEs}
            </p>
          )}
          <nav className="flashcard__navigation" aria-label="Navegación de tarjetas">
            <button
              type="button"
              disabled={session.atStart}
              onClick={() => setSession(prev)}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={session.atEnd}
              onClick={() => setSession(next)}
            >
              Siguiente
            </button>
          </nav>
        </div>
      ) : (
        <div className="flashcard__front">
          <p>¿Qué significa? Pensá un ejemplo con esta expresión.</p>
          <button type="button" onClick={() => setSession(reveal)}>
            Reveal
          </button>
        </div>
      )}
    </section>
  );
}
