import Link from "next/link";
import { Suspense } from "react";
import { getWordFamilies } from "../../src/infrastructure/word-formation-loader";
import { BackIcon } from "../components/ui/BackIcon";
import { WordFormationSectionClient } from "../components/WordFormationSectionClient";

const families = getWordFamilies();

export default async function WordFormationPage() {
  return (
    <main className="practice-layout" id="contenido">
      <div className="practice-layout__content">
        <header className="practice-header">
          <Link href="/" className="grammar-index__back"><BackIcon /> All sections</Link>
          <h1>Word Formation</h1>
          <p>Produce: noun / adjective / adverb.</p>
        </header>
        <Suspense fallback={null}>
          <WordFormationSectionClient
            families={families}
            pathname="/word-formation"
            accent="var(--accent-word-formation)"
          />
        </Suspense>
      </div>
    </main>
  );
}
