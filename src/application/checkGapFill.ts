export function checkGapFill(guess: string, answer: string): { correct: boolean } {
  const firstAnswer = answer.split("/")[0] ?? "";

  return { correct: normalize(guess) === normalize(firstAnswer) };
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
