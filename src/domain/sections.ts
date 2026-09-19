export const SECTIONS = [
  "phrasal-verbs",
  "collocations",
  "prepositions",
  "idioms",
  "irregular-verbs",
  "word-formation",
  "everyday-phrases",
] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  "phrasal-verbs": "Phrasal verbs",
  collocations: "Collocations",
  prepositions: "Prepositions",
  idioms: "Idioms & Expressions",
  "irregular-verbs": "Irregular Verbs",
  "word-formation": "Word Formation",
  "everyday-phrases": "Everyday Phrases",
};

export const SECTION_FILES: Record<Section, string> = {
  "phrasal-verbs": "data/phrasal-verbs-b1-b2-200.md",
  collocations: "data/collocations-b1-b2.md",
  prepositions: "data/fixed-prepositions-b1-b2.md",
  idioms: "data/idioms-b1-b2.md",
  "irregular-verbs": "data/irregular-verbs-b1-b2.md",
  "word-formation": "data/word-formation-b1-b2.md",
  "everyday-phrases": "data/everyday-phrases-b1-b2-150.md",
};
