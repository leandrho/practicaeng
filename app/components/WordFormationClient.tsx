"use client";

import { useEffect, useState } from "react";
import { checkGapFill } from "../../src/application/checkGapFill";
import type { WordFamily } from "../../src/domain/word-formation";
import { EmptyState } from "./EmptyState";
import { Button } from "./ui/Button";

type WFState = {
  index: number;
  revealed: boolean;
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
    guess: "",
    checked: "idle",
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.key !== " ") {
        return;
      }

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
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

  const answer = family.noun ?? family.adjective ?? family.adverb;

  if (answer === undefined) {
    return <p className="flashcard-empty">This family has no exercises available.</p>;
  }

  const gapFillAnswer = answer;

  function checkAnswer() {
    const { correct } = checkGapFill(state.guess, gapFillAnswer);

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
      <h1>{family.base.toUpperCase()}</h1>
      {state.revealed ? (
        <div key={`${family.base}:dorso`} className="flashcard__answer flashcard__face">
          <p>
            <strong>Noun:</strong> {family.noun ?? "—"}
          </p>
          <p>
            <strong>Adjective:</strong> {family.adjective ?? "—"}
          </p>
          <p>
            <strong>Adverb:</strong> {family.adverb ?? "—"}
          </p>
          {family.meaningHint === undefined ? null : (
            <p>
              <strong>Hint:</strong> {family.meaningHint}
            </p>
          )}
          <ul className="flashcard__list">
            {family.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
          <nav className="flashcard__navigation" aria-label="Family navigation">
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
        </div>
      ) : (
        <div key={`${family.base}:frente`} className="flashcard__front flashcard__face">
          <p>Produce: noun / adjective / adverb.</p>
          <form className="flashcard__form" onSubmit={handleSubmit}>
            <label htmlFor="word-formation-guess">
              Complete with the correct form of &quot;{family.base.toUpperCase()}&quot;: ______ ({family.base.toUpperCase()})
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
              placeholder="Type the first form if there are alternatives…"
            />
            <Button className="btn btn--primary" type="submit">
              Check
            </Button>
          </form>
          <div aria-live="polite">
            {state.checked === "correct" ? <p>Correct: {gapFillAnswer}</p> : null}
            {state.checked === "incorrect" ? <p>Not yet: try again.</p> : null}
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
    </section>
  );
}
