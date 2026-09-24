"use client";

import { useEffect, useState } from "react";
import type { GrammarExercise } from "../../src/domain/grammar";
import type { PracticeRating } from "../../src/application/practice-session";
import type { PracticeStorageBackend } from "../../src/infrastructure/ui/practice-storage";
import { shouldIgnorePracticeShortcut } from "../../src/infrastructure/ui/keyboard";
import { useGrammarPractice } from "./useGrammarPractice";
import { Button } from "./ui/Button";

type GrammarPracticeClientProps = {
  /** Ejercicios del tema en orden pedagógico (el hook acota a 10). */
  exercises: GrammarExercise[];
  part: number;
  slug: string;
  /** Ruta de la sesión (una sesión independiente por ruta). Sin ruta: efímera. */
  route?: string;
  backend?: PracticeStorageBackend;
  onProgressChange?: (hasProgress: boolean) => void;
};

const RATING_OPTIONS: { rating: PracticeRating; label: string }[] = [
  { rating: "known", label: "I knew it" },
  { rating: "almost", label: "Almost" },
  { rating: "unknown", label: "I didn't know" },
];

function renderExplanation(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) => {
    const emphasized = part.match(/^\*([^*]+)\*$/);
    return emphasized ? <em key={index} lang="en">{emphasized[1]}</em> : part;
  });
}

export function GrammarPracticeClient({
  exercises,
  part,
  slug,
  route,
  backend,
  onProgressChange,
}: GrammarPracticeClientProps) {
  const practice = useGrammarPractice({
    route: route ?? "__ephemeral__",
    part,
    slug,
    exercises,
    backend,
    persist: route !== undefined,
    onProgressChange,
  });

  const [direction, setDirection] = useState<"next" | "prev">("next");

  const {
    session,
    roundExercises,
    roundKeys,
    index,
    revealed,
    counts,
    pendingCount,
  } = practice;
  const exercise = roundExercises[index] ?? null;
  const exerciseKey = roundKeys[index] ?? null;
  const currentRating =
    exerciseKey === null ? undefined : session?.roundRatings[exerciseKey];
  const total = roundExercises.length;
  const isReview = session?.phase === "review";
  const isSummary = session?.phase === "summary";

  function goPrev() {
    setDirection("prev");
    practice.goPrev();
  }

  function goNext() {
    setDirection("next");
    practice.goNext();
  }

  function handleRate(rating: PracticeRating) {
    setDirection("next");
    practice.rate(rating);
  }

  function handleSkip() {
    setDirection("next");
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
      <div
        className="flashcard flashcard--grammar practice-summary"
        aria-live="polite"
        style={{ "--card-accent": "var(--accent-grammar)" } as React.CSSProperties}
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
      </div>
    );
  }

  if (exercise === null) {
    return <p className="flashcard-empty">No exercises available for this topic.</p>;
  }

  return (
    <div className="flashcard flashcard--grammar" data-dir={direction} style={{ "--card-accent": "var(--accent-grammar)" } as React.CSSProperties}>
      <div className="flashcard__top">
        <p className="flashcard__progress" aria-live="polite">
          {isReview ? `Review card ${index + 1} of ${total}` : `Card ${index + 1} of ${total}`}
        </p>
        <div className="flashcard__meter" aria-hidden="true">
          <span style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>
      <div className="flashcard__body" key={`${session?.phase ?? "initial"}:${exerciseKey ?? index}`}>
        <p className="flashcard__kicker">Your turn</p>
        <div className="flashcard__head">
          <h3 lang="en">{exercise.promptEn}</h3>
        </div>
        {revealed ? (
          <>
            <div className="flashcard__answer flashcard__face" aria-live="polite">
              <div className="answer-block answer-block--meaning">
                <span className="answer-pill">Model</span>
                <p className="answer-text answer-text--meaning" lang="en">{exercise.modelEn}</p>
              </div>
              <div className="answer-block">
                <span className="answer-pill answer-pill--ghost">Explanation</span>
                <p className="answer-text" lang="es">{renderExplanation(exercise.explanationEs)}</p>
              </div>
              <div className="answer-block answer-block--example">
                <span className="answer-pill answer-pill--outline">Translation</span>
                <p className="answer-text answer-text--example" lang="es">{exercise.translationEs}</p>
              </div>
            </div>
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
                  onClick={() => handleRate(option.rating)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="flashcard__front flashcard__face">
            <p>Think of your sentence or say it aloud before revealing.</p>
            <div className="flashcard__front-actions">
              <Button className="btn btn--primary" onClick={practice.reveal}>Reveal</Button>
              <Button className="btn btn--ghost" onClick={handleSkip}>Skip</Button>
            </div>
          </div>
        )}
      </div>
      <nav className="flashcard__navigation flashcard__navigation--footer" aria-label="Card navigation">
        <Button className="btn btn--ghost" disabled={practice.atStart} onClick={goPrev}>Previous</Button>
        <Button className="btn btn--primary" disabled={practice.atEnd} onClick={goNext}>Next</Button>
      </nav>
    </div>
  );
}
