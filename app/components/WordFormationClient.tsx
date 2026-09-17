"use client";

import { useEffect, useState } from "react";
import { checkGapFill } from "../../src/application/checkGapFill";
import type { WordFamily } from "../../src/domain/word-formation";

type WFState = {
  index: number;
  revealed: boolean;
  guess: string;
  checked: "idle" | "correct" | "incorrect";
};

type WordFormationClientProps = {
  families: WordFamily[];
};

export default function WordFormationClient({ families }: WordFormationClientProps) {
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

  if (family === undefined) {
    return <p className="flashcard-empty">No hay familias disponibles.</p>;
  }

  const answer = family.noun ?? family.adjective ?? family.adverb;

  if (answer === undefined) {
    return <p className="flashcard-empty">Esta familia no tiene ejercicios disponibles.</p>;
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
    <section className="flashcard">
      <p className="mb-3 text-sm font-semibold tracking-wide text-[var(--muted-ink)]">Base</p>
      <h1>{family.base.toUpperCase()}</h1>
      {state.revealed ? (
        <div className="flashcard__answer">
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
              <strong>Pista:</strong> {family.meaningHint}
            </p>
          )}
          <ul className="grid gap-2 pl-5">
            {family.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
          <nav className="flashcard__navigation sm:justify-between" aria-label="Navegación de familias">
            <button type="button" disabled={state.index === 0} onClick={() => move(-1)}>
              Anterior
            </button>
            <button
              type="button"
              disabled={state.index === families.length - 1}
              onClick={() => move(1)}
            >
              Siguiente
            </button>
          </nav>
        </div>
      ) : (
        <div className="flashcard__front grid gap-6 sm:gap-8">
          <p>Producí: noun / adjective / adverb.</p>
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <label htmlFor="word-formation-guess">
              Complete with the correct form of &quot;{family.base.toUpperCase()}&quot;: ______ ({family.base.toUpperCase()})
            </label>
            <input
              id="word-formation-guess"
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
              className="min-h-12 border border-[var(--line)] bg-white px-3 py-2 text-lg text-[var(--ink)]"
              placeholder="Escribí la primera forma si hay alternativas"
            />
            <button className="w-full sm:w-fit" type="submit">
              Comprobar
            </button>
          </form>
          <div aria-live="polite">
            {state.checked === "correct" ? <p>Correcto: {gapFillAnswer}</p> : null}
            {state.checked === "incorrect" ? <p>Todavía no: probá de nuevo.</p> : null}
          </div>
          <button
            className="w-full sm:w-fit"
            type="button"
            onClick={() => setState((current) => ({ ...current, revealed: true }))}
          >
            Revelar familia
          </button>
        </div>
      )}
    </section>
  );
}
