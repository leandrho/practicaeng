"use client";

import { useEffect, useState } from "react";
import type { Card } from "../../src/domain/card";
import { CARD_TYPE_LABELS } from "../../src/domain/card";
import { resolveHint } from "../../src/domain/hints";
import { shouldIgnorePracticeShortcut } from "../../src/infrastructure/ui/keyboard";
import { HintGallery } from "../../src/infrastructure/hints/gallery";
import type {
  PracticeRating,
  PracticeSelection,
} from "../../src/application/practice-session";
import type { PracticeStorageBackend } from "../../src/infrastructure/ui/practice-storage";
import { EmptyState } from "./EmptyState";
import { useVocabularyPractice } from "./useVocabularyPractice";
import { Button } from "./ui/Button";
import { BookIcon } from "./ui/BookIcon";
import { ContextBook } from "./ui/ContextBook";
import { HintIcon } from "./ui/HintIcon";

type FlashcardClientProps = {
  /** Mazo filtrado en orden canónico (el hook limita a 10 y fija el orden). */
  cards: Card[];
  clearFiltersPath: string;
  accent?: string;
  showTypeBadge?: boolean;
  /** Ruta de la sesión (una sesión independiente por ruta). Sin ruta: efímera. */
  route?: string;
  /** Mazo canónico completo para IDs estables (por defecto `cards`). */
  allCards?: Card[];
  selection?: PracticeSelection;
  /** Cambia para forzar una sesión nueva (reshuffle desde el drawer). */
  reshuffleCount?: number;
  backend?: PracticeStorageBackend;
  onProgressChange?: (hasProgress: boolean) => void;
};

type PracticeCardViewProps = {
  card: Card;
  showTypeBadge: boolean;
  revealed: boolean;
  currentRating: PracticeRating | undefined;
  onReveal: () => void;
  onRate: (rating: PracticeRating) => void;
  onSkip: () => void;
};

function PracticeCardView({
  card,
  showTypeBadge,
  revealed,
  currentRating,
  onReveal,
  onRate,
  onSkip,
}: PracticeCardViewProps) {
  // Estado local por tarjeta: la key del padre lo resetea al cambiar de
  // tarjeta o de ronda, incluida la respuesta revelada.
  const [showEs, setShowEs] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const hintId = resolveHint(card.expression, card.type, card.category);
  const hasVisualHint = card.type !== "connector";

  return (
    <div className="flashcard__body">
      {showTypeBadge ? (
        <p className="flashcard__type-badge">{CARD_TYPE_LABELS[card.type]}</p>
      ) : null}
      <div className="flashcard__head">
        <h2>{card.expression}</h2>
        <div className="flashcard__hint-actions">
          <Button
            className="btn btn--ghost btn--hint"
            disabled={!hasVisualHint}
            aria-pressed={showHint}
            aria-label={showHint ? "Hide visual hint" : "Show visual hint"}
            title={hasVisualHint ? "Ver pista" : "No hay pista visual para conectores"}
            onClick={() => setShowHint((current) => !current)}
          >
            <HintIcon />
          </Button>
          <Button
            className="btn btn--ghost btn--context"
            aria-pressed={showContext}
            aria-label={showContext ? "Hide context hint" : "Show context hint"}
            title="Ver contexto"
            onClick={() => setShowContext((current) => !current)}
          >
            <BookIcon />
          </Button>
        </div>
      </div>
      {showHint ? (
        <div className="flashcard__hint-panel" aria-live="polite">
          <HintGallery hintId={hintId} />
        </div>
      ) : null}
      {showContext ? (
        <div className="flashcard__context-panel">
          <ContextBook
            expression={card.expression}
            contextEn={card.contextEn}
            contextSource={card.contextSource}
          />
        </div>
      ) : null}
      {revealed ? (
        <>
          <FlashcardAnswer
            card={card}
            showEs={showEs}
            onToggleEs={() => setShowEs((current) => !current)}
          />
          <div className="practice-ratings" role="group" aria-label="Rate this card">
            {RATING_OPTIONS.map((option) => (
              <Button
                key={option.rating}
                className={
                  option.rating === "known"
                    ? "btn btn--primary"
                    : "btn btn--ghost"
                }
                aria-pressed={currentRating === option.rating}
                onClick={() => onRate(option.rating)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <FlashcardFront onReveal={onReveal} onSkip={onSkip} />
      )}
    </div>
  );
}

type FlashcardFrontProps = {
  onReveal: () => void;
  onSkip: () => void;
};

function FlashcardFront({ onReveal, onSkip }: FlashcardFrontProps) {
  return (
    <div className="flashcard__front flashcard__face">
      <p className="flashcard__recall">
        Ver · recordar · producir. Then reveal and compare.
      </p>
      <div className="flashcard__front-actions">
        <Button className="btn btn--primary" onClick={onReveal}>
          Reveal
        </Button>
        <Button className="btn btn--ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
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
              <div className="answer-block answer-block--forms">
                <p className="answer-form">
                  <span className="answer-pill answer-pill--ghost">Past simple:</span>{" "}
                  <span className="answer-text answer-text--form">{card.pastSimple}</span>
                </p>
                <p className="answer-form">
                  <span className="answer-pill answer-pill--ghost">Past participle:</span>{" "}
                  <span className="answer-text answer-text--form">{card.pastParticiple}</span>
                </p>
              </div>
            ) : null}
            <div className="answer-block answer-block--meaning">
              <span className="answer-pill">Meaning:</span>
              <p className="answer-text answer-text--meaning">
                {showEs ? card.meaningEs : card.meaningEn}
              </p>
            </div>
            <div className="answer-block answer-block--example">
              <span className="answer-pill answer-pill--outline">Example:</span>
              <p className="answer-text answer-text--example">
                {showEs ? card.translationEs : card.exampleEn}
              </p>
            </div>
            {card.tags.length > 0 ? (
              <div className="flashcard__tags" role="group" aria-label="Card tags">
                {card.tags.map((tag) => (
                  <span className="flashcard__tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
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

const RATING_OPTIONS: { rating: PracticeRating; label: string }[] = [
  { rating: "known", label: "I knew it" },
  { rating: "almost", label: "Almost" },
  { rating: "unknown", label: "I didn't know" },
];

export default function FlashcardClient({
  cards,
  clearFiltersPath,
  accent,
  showTypeBadge = false,
  route,
  allCards,
  selection = { order: "ordered" },
  reshuffleCount = 0,
  backend,
  onProgressChange,
}: FlashcardClientProps) {
  const practice = useVocabularyPractice({
    route: route ?? "__ephemeral__",
    allCards: allCards ?? cards,
    filteredCards: cards,
    selection,
    reshuffleCount,
    backend,
    persist: route !== undefined,
    onProgressChange,
  });

  const [dir, setDir] = useState<1 | -1>(1);

  const {
    session,
    roundCards,
    roundKeys,
    index,
    revealed,
    counts,
    pendingCount,
  } = practice;
  const card = roundCards[index] ?? null;
  const cardKey = roundKeys[index] ?? null;
  const currentRating =
    cardKey === null ? undefined : session?.roundRatings[cardKey];
  const total = roundCards.length;
  const position = total === 0 ? 0 : index + 1;
  const progress = total === 0 ? 0 : (position / total) * 100;
  const isReview = session?.phase === "review";
  const isSummary = session?.phase === "summary";

  function goPrev() {
    setDir(-1);
    practice.goPrev();
  }

  function goNext() {
    setDir(1);
    practice.goNext();
  }

  function handleRate(rating: PracticeRating) {
    setDir(1);
    practice.rate(rating);
  }

  function handleSkip() {
    setDir(1);
    practice.skip();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (shouldIgnorePracticeShortcut(event)) {
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
          practice.reveal();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (isSummary && session !== null) {
    return (
      <section
        className="flashcard practice-summary"
        aria-live="polite"
        style={accent === undefined ? undefined : ({ "--card-accent": accent } as React.CSSProperties)}
      >
        <h2 className="practice-summary__title">Session summary</h2>
        <ul className="practice-summary__counts">
          <li>
            <span>I knew it:</span> <strong>{counts.known}</strong>
          </li>
          <li>
            <span>Almost:</span> <strong>{counts.almost}</strong>
          </li>
          <li>
            <span>I didn&apos;t know:</span> <strong>{counts.unknown}</strong>
          </li>
          <li>
            <span>Skipped:</span> <strong>{counts.skipped}</strong>
          </li>
        </ul>
        {pendingCount > 0 ? (
          <p className="practice-summary__pending">
            {pendingCount} pending for review.
          </p>
        ) : (
          <p className="practice-summary__pending">No pending cards. Nice work!</p>
        )}
        <div className="practice-summary__actions">
          {pendingCount > 0 ? (
            <Button className="btn btn--primary" onClick={practice.startReview}>
              Review pending ({pendingCount})
            </Button>
          ) : null}
          <Button className="btn btn--ghost" onClick={practice.startNewSession}>
            Start new session
          </Button>
        </div>
      </section>
    );
  }

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
          {isReview ? `Review card ${position} of ${total}` : `Card ${position} of ${total}`}
        </p>
        <div className="flashcard__meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <PracticeCardView
        key={`${session?.phase ?? "initial"}:${cardKey ?? card.expression}`}
        card={card}
        showTypeBadge={showTypeBadge}
        revealed={revealed}
        currentRating={currentRating}
        onReveal={practice.reveal}
        onRate={handleRate}
        onSkip={handleSkip}
      />
      <nav className="flashcard__navigation flashcard__navigation--footer" aria-label="Card navigation">
        <Button className="btn btn--ghost" disabled={practice.atStart} onClick={goPrev}>
          Previous
        </Button>
        <Button className="btn btn--primary" disabled={practice.atEnd} onClick={goNext}>
          Next
        </Button>
      </nav>
    </section>
  );
}
