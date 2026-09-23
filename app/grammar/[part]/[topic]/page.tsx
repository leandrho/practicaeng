import Link from "next/link";
import { notFound } from "next/navigation";
import { GRAMMAR_PARTS } from "../../../../src/domain/grammar-catalog";
import { getGrammarTopics } from "../../../../src/infrastructure/grammar-loader";
import { GrammarPracticeClient } from "../../../components/GrammarPracticeClient";
import { GrammarTheoryClient } from "../../../components/GrammarTheoryClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return GRAMMAR_PARTS.flatMap((part) =>
    part.topics.map(({ slug }) => ({ part: `parte-${part.number}`, topic: slug })),
  );
}

export default async function GrammarTopicPage({
  params,
}: {
  params: Promise<{ part: string; topic: string }>;
}) {
  const { part, topic: slug } = await params;
  const match = GRAMMAR_PARTS.find((entry) => `parte-${entry.number}` === part);
  if (!match || !match.topics.some((entry) => entry.slug === slug)) {
    notFound();
  }

  const topic = getGrammarTopics().find((entry) => entry.part === match.number && entry.slug === slug);
  if (!topic) notFound();

  return (
    <main className="practice-layout grammar-topic-page" id="contenido">
      <div className="practice-layout__content">
        <header className="practice-header">
          <Link className="grammar-index__back" href="/grammar">← All grammar topics</Link>
          <p>Part {match.number} · Grammar B1+</p>
          <h1>{topic.title}</h1>
        </header>
        <GrammarTheoryClient topic={topic} />
        <section className="grammar-practice-section" id="grammar-practice" aria-label="Practice">
          <h2>Practice · {topic.exercises.length} cards</h2>
          <GrammarPracticeClient exercises={topic.exercises} />
        </section>
      </div>
    </main>
  );
}
