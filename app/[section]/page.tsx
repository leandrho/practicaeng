import { notFound } from "next/navigation";
import {
  CONTENT_SECTIONS,
  contentRepository,
  type ContentSection,
} from "../../src/infrastructure/content-loader";
import { Flashcard } from "../components/Flashcard";

export const dynamicParams = false;

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
  const card = cards[0];

  if (card === undefined) {
    notFound();
  }

  return <Flashcard cards={cards} />;
}
