"use client";

import { useEffect, useState } from "react";
import { init, next, prev, reveal } from "../../src/application/session";
import type { Card } from "../../src/domain/card";
import { resolveHint } from "../../src/domain/hints";
import { HintGallery } from "../../src/infrastructure/hints/gallery";
import { EmptyState } from "./EmptyState";
import { Button } from "./ui/Button";
import { HintIcon } from "./ui/HintIcon";

type FlashcardClientProps = {
  cards: Card[];
  clearFiltersPath: string;
  accent?: string;
};

type FlashcardFrontProps = {
  card: Card;
  onReveal: () => void;
};

function FlashcardFront({ card, onReveal }: FlashcardFrontProps) {
  return (
    <div key={`${card.expression}:frente`} className="flashcard__front flashcard__face">
      <Button className="btn btn--primary" onClick={onReveal}>
        Reveal
      </Button>
    </div>
  );
}

type FlashcardAnswerProps = {
  card: Card;
  showEs: boolean;
  onToggleEs: () => void;
};

function FlashcardAnswer({ card, showEs, onToggleEs }: FlashcardAnswerProps) {
  return (
    <div
      key={`${card.expression}:dorso`}
      className="flashcard__answer flashcard__face"
      aria-live="polite"
    >
      <div aria-live="polite">
        <div className="flashcard__answer-row">
          <div className="flashcard__answer-copy">
            {card.pastSimple !== undefined && card.pastParticiple !== undefined ? (
              <>
                <p>
                  <strong>Past simple:</strong> {card.pastSimple}
                </p>
                <p>
                  <strong>Past participle:</strong> {card.pastParticiple}
                </p>
              </>
            ) : null}
            <p>
              <strong>Meaning:</strong> {showEs ? card.meaningEs : card.meaningEn}
            </p>
            <p>
              <strong>Example:</strong> {showEs ? card.translationEs : card.exampleEn}
            </p>
          </div>
          <Button
            className="btn btn--ghost flashcard__language-toggle"
            aria-pressed={showEs}
            aria-label={showEs ? "Show English explanation" : "Show Spanish translation"}
            onClick={onToggleEs}
          >
            {showEs ? "EN" : "ES"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardClient({ cards, clearFiltersPath, accent }: FlashcardClientProps) {
  const [session, setSession] = useState(() => init(cards));
  const [dir, setDir] = useState<1 | -1>(1);
  const [showEs, setShowEs] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const card = session.current;
  const total = session.cards.length;
  const position = total === 0 ? 0 : session.index + 1;
  const progress = total === 0 ? 0 : (position / total) * 100;

  function goPrev() {
    setDir(-1);
    setShowEs(false);
    setShowHint(false);
    setSession(prev);
  }

  function goNext() {
    setDir(1);
    setShowEs(false);
    setShowHint(false);
    setSession(next);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          event.preventDefault();
          goNext();
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

  const hintId = resolveHint(card.expression, card.type, card.category);

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
        <div className="flashcard__head">
          <h2>{card.expression}</h2>
          <Button
            className="btn btn--ghost btn--hint"
            aria-pressed={showHint}
            aria-label={showHint ? "Hide visual hint" : "Show visual hint"}
            title="Ver pista"
            onClick={() => setShowHint((current) => !current)}
          >
            <HintIcon />
          </Button>
        </div>
        {showHint ? (
          <div className="flashcard__hint-panel" aria-live="polite">
            <HintGallery hintId={hintId} />
          </div>
        ) : null}
        {session.revealed ? (
          <FlashcardAnswer
            card={card}
            showEs={showEs}
            onToggleEs={() => setShowEs((current) => !current)}
          />
        ) : (
          <FlashcardFront card={card} onReveal={() => setSession(reveal)} />
        )}
      </div>
      <nav className="flashcard__navigation flashcard__navigation--footer" aria-label="Card navigation">
        <Button className="btn btn--ghost" disabled={session.atStart} onClick={goPrev}>
          Previous
        </Button>
        <Button className="btn btn--primary" disabled={session.atEnd} onClick={goNext}>
          Next
        </Button>
      </nav>
    </section>
  );
}
