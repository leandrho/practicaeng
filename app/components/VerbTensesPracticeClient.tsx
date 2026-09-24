"use client";

import { useEffect, useState } from "react";
import { checkGapFill } from "../../src/application/checkGapFill";
import type { VerbTenseExercise } from "../../src/domain/verb-tenses";
import { shouldIgnorePracticeShortcut } from "../../src/infrastructure/ui/keyboard";
import { Button } from "./ui/Button";
import { BookIcon } from "./ui/BookIcon";
import { CheckIcon } from "./ui/CheckIcon";
import { ContextBook } from "./ui/ContextBook";
import { CrossIcon } from "./ui/CrossIcon";

type VerbTensesState = {
  index: number;
  guess: string;
  checked: "idle" | "correct" | "incorrect";
  showContext: boolean;
  revealed: boolean;
};

type VerbTensesPracticeClientProps = {
  exercises: VerbTenseExercise[];
  accent?: string;
};

function renderExplanation(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) => {
    const emphasized = part.match(/^\*([^*]+)\*$/);
    return emphasized ? (
      <em key={index} lang="en">
        {emphasized[1]}
      </em>
    ) : (
      part
    );
  });
}

export function VerbTensesPracticeClient({
  exercises,
  accent,
}: VerbTensesPracticeClientProps) {
  const [state, setState] = useState<VerbTensesState>({
    index: 0,
    guess: "",
    checked: "idle",
    showContext: false,
    revealed: false,
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.key !== " ") {
        return;
      }
      if (shouldIgnorePracticeShortcut(event)) {
        return;
      }
      event.preventDefault();
      setState((current) => ({ ...current, revealed: true }));
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const total = exercises.length;
  const exercise = exercises[state.index];

  if (exercise === undefined) {
    return <p className="flashcard-empty">No exercises available.</p>;
  }

  const position = state.index + 1;
  const progress = total === 0 ? 0 : (position / total) * 100;
  const acceptedAnswers = exercise.acceptedAnswers;

  function checkAnswer() {
    const { correct } = checkGapFill(state.guess, acceptedAnswers);
    setState((current) => ({
      ...current,
      checked: correct ? "correct" : "incorrect",
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    checkAnswer();
  }

  function move(offset: number) {
    setState((current) => ({
      index: Math.max(0, Math.min(total - 1, current.index + offset)),
      guess: "",
      checked: "idle",
      showContext: false,
      revealed: false,
    }));
  }

  return (
    <section
      className="flashcard flashcard--verb-tenses"
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
      {state.revealed ? <p className="flashcard__type-badge">{exercise.form}</p> : null}
      <p className="flashcard__kicker">Your turn</p>
      <div className="flashcard__head">
        <h3 lang="en">{exercise.promptEn}</h3>
        <div className="flashcard__hint-actions">
          <Button
            className="btn btn--ghost btn--context"
            aria-pressed={state.showContext}
            aria-label={state.showContext ? "Hide context hint" : "Show context hint"}
            title="Ver contexto"
            onClick={() => setState((current) => ({ ...current, showContext: !current.showContext }))}
          >
            <BookIcon />
          </Button>
        </div>
      </div>
      {state.showContext ? (
        <div className="flashcard__context-panel">
          <ContextBook
            expression={acceptedAnswers[0] ?? ""}
            contextEn={exercise.contextEn}
            contextSource={exercise.contextSource}
          />
        </div>
      ) : null}
      <div className="flashcard__body" key={state.index}>
        {state.revealed ? (
          <div className="flashcard__answer flashcard__face" aria-live="polite">
            <div className="answer-block answer-block--meaning">
              <span className="answer-pill">Model</span>
              <p className="answer-text answer-text--meaning" lang="en">
                {exercise.modelEn}
              </p>
            </div>
            <div className="answer-block">
              <span className="answer-pill answer-pill--ghost">Explanation</span>
              <p className="answer-text" lang="es">
                {renderExplanation(exercise.explanationEs)}
              </p>
            </div>
            <div className="answer-block answer-block--example">
              <span className="answer-pill answer-pill--outline">Translation</span>
              <p className="answer-text answer-text--example" lang="es">
                {exercise.translationEs}
              </p>
            </div>
          </div>
        ) : (
          <div className="flashcard__front flashcard__face">
            <p className="flashcard__sentence" lang="en">
              {exercise.sentenceEn}
            </p>
            <form className="flashcard__form" onSubmit={handleSubmit}>
              <label htmlFor="verb-tenses-guess">Type the missing words</label>
              <input
                id="verb-tenses-guess"
                name="guess"
                autoComplete="off"
                value={state.guess}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    guess: event.target.value,
                    checked: "idle",
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    checkAnswer();
                  }
                }}
                className="field"
                placeholder="Type the missing words…"
              />
              <Button className="btn btn--primary" type="submit">
                Check
              </Button>
            </form>
            <div aria-live="polite">
              {state.checked === "correct" ? (
                <p className="feedback feedback--correct">
                  <CheckIcon /> <span>Correct: {acceptedAnswers.join(" / ")}</span>
                </p>
              ) : null}
              {state.checked === "incorrect" ? (
                <p className="feedback feedback--incorrect">
                  <CrossIcon /> <span>Not yet: try again.</span>
                </p>
              ) : null}
            </div>
            <div>
              <Button
                className="btn btn--ghost"
                onClick={() => setState((current) => ({ ...current, revealed: true }))}
              >
                Reveal
              </Button>
            </div>
          </div>
        )}
      </div>
      <nav
        className="flashcard__navigation flashcard__navigation--footer"
        aria-label="Card navigation"
      >
        <Button className="btn btn--ghost" disabled={state.index === 0} onClick={() => move(-1)}>
          Previous
        </Button>
        <Button
          className="btn btn--primary"
          disabled={state.index === total - 1}
          onClick={() => move(1)}
        >
          Next
        </Button>
      </nav>
    </section>
  );
}
