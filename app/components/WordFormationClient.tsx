"use client";

import { useEffect, useState } from "react";
import { checkGapFill } from "../../src/application/checkGapFill";
import { resolveHint } from "../../src/domain/hints";
import type { WordFamily } from "../../src/domain/word-formation";
import { shouldIgnorePracticeShortcut } from "../../src/infrastructure/ui/keyboard";
import { HintGallery } from "../../src/infrastructure/hints/gallery";
import { EmptyState } from "./EmptyState";
import { Button } from "./ui/Button";
import { BookIcon } from "./ui/BookIcon";
import { CheckIcon } from "./ui/CheckIcon";
import { ContextBook } from "./ui/ContextBook";
import { CrossIcon } from "./ui/CrossIcon";
import { HintIcon } from "./ui/HintIcon";

type WFState = {
  index: number;
  revealed: boolean;
  showEs: boolean;
  showHint: boolean;
  showContext: boolean;
  guess: string;
  checked: "idle" | "correct" | "incorrect";
};

type WordFormationClientProps = {
  families: WordFamily[];
  clearFiltersPath: string;
  accent?: string;
};

export default function WordFormationClient({
  families,
  clearFiltersPath,
  accent,
}: WordFormationClientProps) {
  const [state, setState] = useState<WFState>({
    index: 0,
    revealed: false,
    showEs: false,
    showHint: false,
    showContext: false,
    guess: "",
    checked: "idle",
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

  const family = families[state.index];
  const total = families.length;
  const position = total === 0 ? 0 : state.index + 1;
  const progress = total === 0 ? 0 : (position / total) * 100;

  if (family === undefined) {
    return <EmptyState clearFiltersPath={clearFiltersPath} />;
  }

  const exercise = (family as { exercise?: WordFamily["exercise"] }).exercise;

  if (exercise === undefined) {
    return <p className="flashcard-empty">This family has no exercises available.</p>;
  }

  const acceptedAnswers = exercise.acceptedAnswers;
  const hintId = resolveHint(family.base, "word-formation", family.category);

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
      index: current.index + offset,
      revealed: false,
      showEs: false,
      showHint: false,
      showContext: false,
      guess: "",
      checked: "idle",
    }));
  }

  return (
    <section
      className="flashcard"
      style={accent === undefined ? undefined : ({ "--card-accent": accent } as React.CSSProperties)}
    >
      <div className="flashcard__top">
        <p className="flashcard__progress" aria-live="polite">
          Family {position} of {total}
        </p>
        <div className="flashcard__meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="flashcard__kicker">Base</p>
      <div className="flashcard__head">
        <h2>{family.base.toUpperCase()}</h2>
        <div className="flashcard__hint-actions">
          <Button
            className="btn btn--ghost btn--hint"
            aria-pressed={state.showHint}
            aria-label={state.showHint ? "Hide visual hint" : "Show visual hint"}
            title="Ver pista"
            onClick={() => setState((current) => ({ ...current, showHint: !current.showHint }))}
          >
            <HintIcon />
          </Button>
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
      {state.showHint ? (
        <div className="flashcard__hint-panel" aria-live="polite">
          <HintGallery hintId={hintId} />
        </div>
      ) : null}
      {state.showContext ? (
        <div className="flashcard__context-panel">
          <ContextBook
            expression={family.base}
            contextEn={family.contextEn}
            contextSource={family.contextSource}
          />
        </div>
      ) : null}
      {state.revealed ? (
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
                  <strong>Hint:</strong> {state.showEs ? family.meaningHint : family.meaningHintEn}
                </p>
              </div>
              <Button
                className="btn btn--ghost flashcard__language-toggle"
                aria-pressed={state.showEs}
                aria-label={state.showEs ? "Show English explanation" : "Show Spanish translation"}
                onClick={() => setState((current) => ({ ...current, showEs: !current.showEs }))}
              >
                {state.showEs ? "EN" : "ES"}
              </Button>
            </div>
          </div>
          <ul className="flashcard__list">
            {family.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
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
              placeholder="Type the missing word…"
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
              Reveal family
            </Button>
          </div>
        </div>
      )}
      <nav
        className="flashcard__navigation flashcard__navigation--footer"
        aria-label="Family navigation"
      >
        <Button className="btn btn--ghost" disabled={state.index === 0} onClick={() => move(-1)}>
          Previous
        </Button>
        <Button
          className="btn btn--primary"
          disabled={state.index === families.length - 1}
          onClick={() => move(1)}
        >
          Next
        </Button>
      </nav>
    </section>
  );
}
