"use client";

import { useEffect, useState } from "react";
import { resolveHint } from "../../src/domain/hints";
import type { WordFamily } from "../../src/domain/word-formation";
import type { PracticeSelection } from "../../src/application/practice-session";
import type { PracticeStorageBackend } from "../../src/infrastructure/ui/practice-storage";
import { shouldIgnorePracticeShortcut } from "../../src/infrastructure/ui/keyboard";
import { HintGallery } from "../../src/infrastructure/hints/gallery";
import { EmptyState } from "./EmptyState";
import { useWordFormationPractice } from "./useWordFormationPractice";
import { Button } from "./ui/Button";
import { BookIcon } from "./ui/BookIcon";
import { CheckIcon } from "./ui/CheckIcon";
import { ContextBook } from "./ui/ContextBook";
import { CrossIcon } from "./ui/CrossIcon";
import { HintIcon } from "./ui/HintIcon";

type WordFormationClientProps = {
  /** Mazo filtrado en orden canónico (el hook limita a 10 y fija el orden). */
  families: WordFamily[];
  clearFiltersPath: string;
  accent?: string;
  /** Ruta de la sesión (una sesión independiente por ruta). Sin ruta: efímera. */
  route?: string;
  /** Mazo canónico completo para IDs estables (por defecto `families`). */
  allFamilies?: WordFamily[];
  selection?: PracticeSelection;
  /** Cambia para forzar una sesión nueva (reshuffle desde el drawer). */
  reshuffleCount?: number;
  backend?: PracticeStorageBackend;
  onProgressChange?: (hasProgress: boolean) => void;
};

type FamilyViewProps = {
  family: WordFamily;
  revealed: boolean;
  isRated: boolean;
  onCheck: (guess: string) => { correct: boolean };
  onReveal: () => void;
  onSkip: () => void;
};

function FamilyView({ family, revealed, isRated, onCheck, onReveal, onSkip }: FamilyViewProps) {
  // Estado local por familia: la key del padre lo resetea al cambiar de
  // familia o de ronda, incluida la respuesta revelada.
  const [showEs, setShowEs] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<"idle" | "correct" | "incorrect">("idle");

  const exercise = (family as { exercise?: WordFamily["exercise"] }).exercise;

  if (exercise === undefined) {
    return <p className="flashcard-empty">This family has no exercises available.</p>;
  }

  const acceptedAnswers = exercise.acceptedAnswers;
  const hintId = resolveHint(family.base, "word-formation", family.category);

  function checkAnswer() {
    const { correct } = onCheck(guess);
    setChecked(correct ? "correct" : "incorrect");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    checkAnswer();
  }

  const showSkip = !revealed && !isRated;

  return (
    <div className="flashcard__body">
      <p className="flashcard__kicker">Base</p>
      <div className="flashcard__head">
        <h2>{family.base.toUpperCase()}</h2>
        <div className="flashcard__hint-actions">
          <Button
            className="btn btn--ghost btn--hint"
            aria-pressed={showHint}
            aria-label={showHint ? "Hide visual hint" : "Show visual hint"}
            title="Ver pista"
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
            expression={family.base}
            contextEn={family.contextEn}
            contextSource={family.contextSource}
          />
        </div>
      ) : null}
      {revealed ? (
        <div key={`${family.base}:dorso`} className="flashcard__answer flashcard__face" aria-live="polite">
          <p>
            <strong>Noun:</strong> {family.noun ?? "—"}
          </p>
          <p>
            <strong>Adjective:</strong> {family.adjective ?? "—"}
          </p>
          <p>
            <strong>Adverb:</strong> {family.adverb ?? "—"}
          </p>
          <div aria-live="polite">
            <div className="flashcard__answer-row">
              <div className="flashcard__answer-copy">
                <p>
                  <strong>Hint:</strong> {showEs ? family.meaningHint : family.meaningHintEn}
                </p>
              </div>
              <Button
                className="btn btn--ghost flashcard__language-toggle"
                aria-pressed={showEs}
                aria-label={showEs ? "Show English explanation" : "Show Spanish translation"}
                onClick={() => setShowEs((current) => !current)}
              >
                {showEs ? "EN" : "ES"}
              </Button>
            </div>
          </div>
          <ul className="flashcard__list">
            {family.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
          <form className="flashcard__form" onSubmit={handleSubmit}>
            <label htmlFor="word-formation-guess">
              Complete with the correct form of &quot;{family.base.toUpperCase()}&quot; ({exercise.target}):
            </label>
            <input
              id="word-formation-guess"
              name="guess"
              autoComplete="off"
              value={guess}
              onChange={(event) => {
                setGuess(event.target.value);
                setChecked("idle");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  checkAnswer();
                }
              }}
              className="field"
              placeholder="Type the missing word…"
            />
            <Button className="btn btn--primary" type="submit">
              Check
            </Button>
          </form>
          <div aria-live="polite">
            {checked === "correct" ? (
              <p className="feedback feedback--correct">
                <CheckIcon /> <span>Correct: {acceptedAnswers.join(" / ")}</span>
              </p>
            ) : null}
            {checked === "incorrect" ? (
              <p className="feedback feedback--incorrect">
                <CrossIcon /> <span>Not yet: try again.</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div key={`${family.base}:frente`} className="flashcard__front flashcard__face">
          <p>
            Complete with the {exercise.target} form of &quot;{family.base.toUpperCase()}&quot;:
          </p>
          <p>{exercise.sentenceEn}</p>
          <form className="flashcard__form" onSubmit={handleSubmit}>
            <label htmlFor="word-formation-guess">
              Complete with the correct form of &quot;{family.base.toUpperCase()}&quot; ({exercise.target}):
            </label>
            <input
              id="word-formation-guess"
              name="guess"
              autoComplete="off"
              value={guess}
              onChange={(event) => {
                setGuess(event.target.value);
                setChecked("idle");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  checkAnswer();
                }
              }}
              className="field"
              placeholder="Type the missing word…"
            />
            <Button className="btn btn--primary" type="submit">
              Check
            </Button>
          </form>
          <div aria-live="polite">
            {checked === "correct" ? (
              <p className="feedback feedback--correct">
                <CheckIcon /> <span>Correct: {acceptedAnswers.join(" / ")}</span>
              </p>
            ) : null}
            {checked === "incorrect" ? (
              <p className="feedback feedback--incorrect">
                <CrossIcon /> <span>Not yet: try again.</span>
              </p>
            ) : null}
          </div>
          <div className="flashcard__front-actions">
            <Button className="btn btn--ghost" onClick={onReveal}>
              Reveal family
            </Button>
            {showSkip ? (
              <Button className="btn btn--ghost" onClick={onSkip}>
                Skip
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WordFormationClient({
  families,
  clearFiltersPath,
  accent,
  route,
  allFamilies,
  selection = { order: "ordered" },
  reshuffleCount = 0,
  backend,
  onProgressChange,
}: WordFormationClientProps) {
  const practice = useWordFormationPractice({
    route: route ?? "__ephemeral__",
    allFamilies: allFamilies ?? families,
    filteredFamilies: families,
    selection,
    reshuffleCount,
    backend,
    persist: route !== undefined,
    onProgressChange,
  });

  const [dir, setDir] = useState<1 | -1>(1);

  const {
    session,
    roundFamilies,
    roundKeys,
    index,
    revealed,
    counts,
    pendingCount,
    isRoundComplete,
  } = practice;
  const family = roundFamilies[index] ?? null;
  const familyKey = roundKeys[index] ?? null;
  const currentRating =
    familyKey === null ? undefined : session?.roundRatings[familyKey];
  const isRated = currentRating !== undefined;
  const total = roundFamilies.length;
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

  if (family === null) {
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
          {isReview ? `Review family ${position} of ${total}` : `Family ${position} of ${total}`}
        </p>
        <div className="flashcard__meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <FamilyView
        key={`${session?.phase ?? "initial"}:${familyKey ?? family.base}`}
        family={family}
        revealed={revealed}
        isRated={isRated}
        onCheck={practice.checkAnswer}
        onReveal={practice.reveal}
        onSkip={handleSkip}
      />
      <nav className="flashcard__navigation flashcard__navigation--footer" aria-label="Family navigation">
        <Button className="btn btn--ghost" disabled={practice.atStart} onClick={goPrev}>
          Previous
        </Button>
        {isRoundComplete ? (
          <Button className="btn btn--primary" onClick={practice.finishRound}>
            See summary
          </Button>
        ) : null}
        <Button className="btn btn--primary" disabled={practice.atEnd} onClick={goNext}>
          Next
        </Button>
      </nav>
    </section>
  );
}
