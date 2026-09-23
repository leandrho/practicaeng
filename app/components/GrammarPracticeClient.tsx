"use client";

import { useState } from "react";
import type { GrammarExercise } from "../../src/domain/grammar";
import { Button } from "./ui/Button";

function renderExplanation(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) => {
    const emphasized = part.match(/^\*([^*]+)\*$/);
    return emphasized ? <em key={index} lang="en">{emphasized[1]}</em> : part;
  });
}

export function GrammarPracticeClient({ exercises }: { exercises: GrammarExercise[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const exercise = exercises[index];

  if (!exercise) return null;

  function move(direction: -1 | 1) {
    setDirection(direction === 1 ? "next" : "prev");
    setIndex((current) => Math.max(0, Math.min(exercises.length - 1, current + direction)));
    setRevealed(false);
  }

  return (
    <div className="flashcard flashcard--grammar" data-dir={direction} style={{ "--card-accent": "var(--accent-grammar)" } as React.CSSProperties}>
      <div className="flashcard__top">
        <p className="flashcard__progress" aria-live="polite">Card {index + 1} of {exercises.length}</p>
        <div className="flashcard__meter" aria-hidden="true">
          <span style={{ width: `${((index + 1) / exercises.length) * 100}%` }} />
        </div>
      </div>
      <div className="flashcard__body" key={index}>
        <p className="flashcard__kicker">Your turn</p>
        <div className="flashcard__head">
          <h3 lang="en">{exercise.promptEn}</h3>
        </div>
        {revealed ? (
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
        ) : (
          <div className="flashcard__front flashcard__face">
            <p>Think of your sentence or say it aloud before revealing.</p>
            <Button className="btn btn--primary" onClick={() => setRevealed(true)}>Reveal</Button>
          </div>
        )}
      </div>
      <nav className="flashcard__navigation flashcard__navigation--footer" aria-label="Card navigation">
        <Button className="btn btn--ghost" disabled={index === 0} onClick={() => move(-1)}>Previous</Button>
        <Button className="btn btn--primary" disabled={index === exercises.length - 1} onClick={() => move(1)}>Next</Button>
      </nav>
    </div>
  );
}
