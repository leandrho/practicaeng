"use client";

import { useEffect, useState } from "react";
import { init, next, prev, reveal } from "../../src/application/session";
import type { Card } from "../../src/domain/card";
import { EmptyState } from "./EmptyState";
import { Button } from "./ui/Button";

type FlashcardClientProps = {
  cards: Card[];
  clearFiltersPath: string;
  accent?: string;
};

export default function FlashcardClient({ cards, clearFiltersPath, accent }: FlashcardClientProps) {
  const [session, setSession] = useState(() => init(cards));
  const [dir, setDir] = useState<1 | -1>(1);
  const card = session.current;
  const total = session.cards.length;
  const position = total === 0 ? 0 : session.index + 1;
  const progress = total === 0 ? 0 : (position / total) * 100;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          setDir(-1);
          setSession(prev);
          break;
        case "ArrowRight":
          event.preventDefault();
          setDir(1);
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
    return <EmptyState clearFiltersPath={clearFiltersPath} />;
  }

  return (
    <section
      className="flashcard"
      data-dir={dir === 1 ? "next" : "prev"}
      style={accent === undefined ? undefined : ({ "--card-accent": accent } as React.CSSProperties)}
    >
      <div className="flashcard__top">
        <p className="flashcard__progress" aria-live="polite">
          Card {position} of {total}
        </p>
        <div className="flashcard__meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div key={card.expression} className="flashcard__body">
        <h1>{card.expression}</h1>
        {session.revealed ? (
        <div
          key={`${card.expression}:dorso`}
          className="flashcard__answer flashcard__face"
          aria-live="polite"
        >
          <p>
            <strong>Meaning:</strong> {card.meaningEs}
          </p>
          <p>
            <strong>Example:</strong> {card.exampleEn}
          </p>
          {card.translationEs === undefined ? null : (
            <p>
              <strong>Translation:</strong> {card.translationEs}
            </p>
          )}
          <nav className="flashcard__navigation" aria-label="Card navigation">
            <Button
              className="btn btn--ghost"
              disabled={session.atStart}
              onClick={() => {
                setDir(-1);
                setSession(prev);
              }}
            >
              Previous
            </Button>
            <Button
              className="btn btn--primary"
              disabled={session.atEnd}
              onClick={() => {
                setDir(1);
                setSession(next);
              }}
            >
              Next
            </Button>
          </nav>
        </div>
      ) : (
        <div key={`${card.expression}:frente`} className="flashcard__front flashcard__face">
          <p>What does it mean? Think of an example with this expression.</p>
          <Button className="btn btn--primary" onClick={() => setSession(reveal)}>
            Reveal
          </Button>
        </div>
      )}
      </div>
    </section>
  );
}
