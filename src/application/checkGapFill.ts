export function checkGapFill(
  guess: string,
  accepted: string | readonly string[],
): { correct: boolean } {
  const acceptedAnswers = Array.isArray(accepted) ? accepted : [accepted];
  const normalizedGuess = normalize(guess);

  return {
    correct: acceptedAnswers.some((answer) => normalize(answer) === normalizedGuess),
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
