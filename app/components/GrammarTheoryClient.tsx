"use client";

import { useState } from "react";
import type { GrammarTopic } from "../../src/domain/grammar";
import { Button } from "./ui/Button";

function sentences(text: string, locale: "en" | "es"): string[] {
  return Array.from(new Intl.Segmenter(locale, { granularity: "sentence" }).segment(text),
    ({ segment }) => segment.trim()).filter(Boolean);
}

function highlightedRule(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const emphasized = part.match(/^\*\*([^*]+)\*\*$/);
    return emphasized ? <strong key={index} className="grammar-theory__highlight">{emphasized[1]}</strong> : part;
  });
}

export function GrammarTheoryClient({ topic }: { topic: GrammarTopic }) {
  const [showEs, setShowEs] = useState(false);
  const pick = (en: string, es: string) => (showEs ? { text: es, locale: "es" as const } : { text: en, locale: "en" as const });
  const definition = pick(topic.definitionEn, topic.definitionEs);
  const rule = pick(topic.ruleEn, topic.ruleEs);
  const uses = pick(topic.usesEn, topic.usesEs);
  const contrasts = pick(topic.contrastsEn, topic.contrastsEs);

  return (
    <article className="grammar-theory" aria-labelledby="grammar-theory-title">
      <header className="grammar-theory__header">
        <h2 id="grammar-theory-title">Theory</h2>
        <div className="grammar-theory__header-actions">
          <a href="#grammar-practice">Go to practice ↓</a>
          <Button
            className="btn btn--ghost flashcard__language-toggle"
            aria-pressed={showEs}
            aria-label={showEs ? "Show English theory" : "Show Spanish theory"}
            onClick={() => setShowEs((current) => !current)}
          >
            {showEs ? "EN" : "ES"}
          </Button>
        </div>
      </header>
      <section className="grammar-theory__formations" aria-labelledby="grammar-formations-title">
        <h3 id="grammar-formations-title">Formation</h3>
        <div className="grammar-theory__formation-grid">
          {topic.formations.map(({ name, patterns }) => (
            <article className="grammar-formation" key={name}>
              <h4>{name}</h4>
              <div className="grammar-formation__patterns">
                {patterns.map(({ label, pattern }, index) => (
                  <div className="grammar-formation__pattern" key={`${label ?? "pattern"}-${index}`}>
                    {label && <strong>{label}:</strong>}
                    <code>{pattern}</code>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="grammar-theory__definition" aria-labelledby="grammar-definition-title">
        <h3 id="grammar-definition-title">Definition</h3>
        {sentences(definition.text, definition.locale).map((sentence, index) => (
          <p key={index} lang={definition.locale}>{highlightedRule(sentence)}</p>
        ))}
      </section>
      <div className="grammar-theory__prose" aria-live="polite">
        <section className="grammar-theory__rule" aria-labelledby="grammar-rule-title">
          <h3 id="grammar-rule-title">Rule</h3>
          {sentences(rule.text, rule.locale).map((sentence, index) => (
            <p key={index} lang={rule.locale}>{highlightedRule(sentence)}</p>
          ))}
        </section>
        <div className="grammar-theory__details">
          <section className="grammar-theory__uses" aria-labelledby="grammar-uses-title">
            <h3 id="grammar-uses-title">When to use</h3>
            <ul lang={uses.locale}>
              {sentences(uses.text, uses.locale).map((sentence, index) => <li key={index}>{sentence}</li>)}
            </ul>
          </section>
          <section className="grammar-theory__traps" aria-labelledby="grammar-traps-title">
            <h3 id="grammar-traps-title">Watch out for this</h3>
            <ul lang={contrasts.locale}>
              {sentences(contrasts.text, contrasts.locale).map((sentence, index) => <li key={index}>{sentence}</li>)}
            </ul>
          </section>
        </div>
      </div>
      <section className="grammar-theory__examples" aria-labelledby="grammar-examples-title">
        <h3 id="grammar-examples-title">In context</h3>
        <ul>
          {topic.examples.map(({ exampleEn, translationEs }) => (
            <li key={exampleEn}>
              <span lang="en">{exampleEn}</span>
              <span lang="es">{translationEs}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
