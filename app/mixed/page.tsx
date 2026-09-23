import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMixedCards } from "../../src/application/getMixedCards";
import {
  MIXED_SECTIONS,
  contentRepository,
} from "../../src/infrastructure/content-loader";
import { SectionPracticeClient } from "../components/SectionPracticeClient";

export default async function MixedPage() {
  const cards = getMixedCards(contentRepository, MIXED_SECTIONS);

  if (cards.length === 0) {
    notFound();
  }

  return (
    <main className="practice-layout" id="contenido">
      <div className="practice-layout__content">
        <header className="practice-header">
          <h1>Mixed Practice</h1>
          <p>All sections shuffled. Recall, reveal, compare.</p>
        </header>
        <Suspense fallback={null}>
          <SectionPracticeClient
            cards={cards}
            pathname="/mixed"
            accent="var(--accent-mixed)"
            showTypeBadge
            disableFilters
          />
        </Suspense>
      </div>
    </main>
  );
}
