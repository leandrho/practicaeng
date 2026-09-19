type ContextBookProps = {
  expression: string;
  contextEn: string;
  contextSource?: string;
};

/**
 * Fragmento de ayuda en inglés con estilo de página de libro.
 * Sin español: solo el párrafo en inglés y el pie con la fuente.
 * La expresión se destaca con `<mark>` (primera ocurrencia, insensible a mayúsculas).
 */
export function ContextBook({ expression, contextEn, contextSource }: ContextBookProps) {
  const source = contextSource ?? "Everyday conversation";
  const lowered = contextEn.toLowerCase();
  const needle = expression.toLowerCase();
  const index = needle.length > 0 ? lowered.indexOf(needle) : -1;

  return (
    <figure className="book-page" aria-live="polite">
      <blockquote>
        <p>
          {index === -1 ? (
            contextEn
          ) : (
            <>
              {contextEn.slice(0, index)}
              <mark>{contextEn.slice(index, index + expression.length)}</mark>
              {contextEn.slice(index + expression.length)}
            </>
          )}
        </p>
      </blockquote>
      <figcaption>{source}</figcaption>
    </figure>
  );
}
