import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CONTENT_SECTIONS,
  contentRepository,
  type ContentSection,
} from "../../src/infrastructure/content-loader";
import { SectionPracticeClient } from "../components/SectionPracticeClient";

export const dynamicParams = false;

const SECTION_ACCENTS: Record<ContentSection, string> = {
  "phrasal-verbs": "var(--accent-phrasal)",
  collocations: "var(--accent-collocations)",
  prepositions: "var(--accent-prepositions)",
  idioms: "var(--accent-idioms)",
  "irregular-verbs": "var(--accent-irregular-verbs)",
  "everyday-phrases": "var(--accent-everyday-phrases)",
  connectors: "var(--accent-connectors)",
};

const SECTION_TITLES: Record<ContentSection, string> = {
  "phrasal-verbs": "Phrasal verbs",
  collocations: "Collocations",
  prepositions: "Prepositions",
  idioms: "Idioms & Expressions",
  "irregular-verbs": "Irregular Verbs",
  "everyday-phrases": "Everyday Phrases",
  connectors: "Connectors",
};

const SECTION_PROMPTS: Record<ContentSection, string> = {
  "phrasal-verbs": "What does it mean? Think of an example with this expression.",
  collocations: "What does it mean? Think of an example with this expression.",
  prepositions: "What does it mean? Think of an example with this expression.",
  idioms: "What does it mean? Think of an example with this expression.",
  "irregular-verbs":
    "Say the past simple and past participle aloud. Then reveal and compare.",
  "everyday-phrases":
    "What does it mean? Think of an example with this expression.",
  connectors:
    "What does it mean? Think of an example with this expression.",
};

export function generateStaticParams() {
  return CONTENT_SECTIONS.map((section) => ({ section }));
}

function isContentSection(section: string): section is ContentSection {
  return CONTENT_SECTIONS.includes(section as ContentSection);
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!isContentSection(section)) {
    notFound();
  }

  const cards = contentRepository.getCards(section);

  if (cards.length === 0) {
    notFound();
  }

  return (
    <main className="practice-layout" id="contenido">
      <div className="practice-layout__content">
        <header className="practice-header">
          <h1>{SECTION_TITLES[section]}</h1>
          <p>{SECTION_PROMPTS[section]}</p>
        </header>
        <Suspense fallback={null}>
          <SectionPracticeClient
            cards={cards}
            pathname={`/${section}`}
            accent={SECTION_ACCENTS[section]}
          />
        </Suspense>
      </div>
    </main>
  );
}
