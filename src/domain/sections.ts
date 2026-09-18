export const SECTIONS = [
  "phrasal-verbs",
  "collocations",
  "prepositions",
  "idioms",
  "irregular-verbs",
  "word-formation",
] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_FILES: Record<Section, string> = {
  "phrasal-verbs": "data/phrasal-verbs-b1-b2-200.md",
  collocations: "data/collocations-b1-b2.md",
  prepositions: "data/fixed-prepositions-b1-b2.md",
  idioms: "data/idioms-b1-b2.md",
  "irregular-verbs": "data/irregular-verbs-b1-b2.md",
  "word-formation": "data/word-formation-b1-b2.md",
};
