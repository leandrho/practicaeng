/**
 * Guardas de teclado para la práctica (SPEC 29 paso 1).
 *
 * Los atajos Espacio/Flechas solo ayudan cuando el foco está en contenido
 * no interactivo de la tarjeta. Si el evento nace en un control, un campo
 * editable o dentro de un diálogo abierto, debe ignorarse para no competir
 * con el control enfocado ni con el modal de filtros.
 */

function getEventDocument(event: KeyboardEvent): Document | null {
  const target = event.target as
    | (Element & { ownerDocument?: Document | null })
    | (Document & { nodeType?: number })
    | Window
    | null
    | undefined;
  if (target !== null && target !== undefined) {
    const asElement = target as Element & { ownerDocument?: Document | null };
    if (
      typeof asElement.ownerDocument === "object" &&
      asElement.ownerDocument !== null &&
      typeof asElement.ownerDocument.querySelector === "function"
    ) {
      return asElement.ownerDocument;
    }
    const asDoc = target as Document;
    if (
      (asDoc as { nodeType?: number }).nodeType === 9 &&
      typeof asDoc.querySelector === "function"
    ) {
      return asDoc;
    }
  }
  if (typeof document !== "undefined") {
    return document;
  }
  return null;
}

export function isPracticeDialogOpen(doc?: Document | null): boolean {
  const root: Document | null =
    doc ?? (typeof document !== "undefined" ? document : null);
  if (root === null || typeof root.querySelector !== "function") {
    return false;
  }
  return (
    root.querySelector('[role="dialog"][data-open="true"], dialog[open]') !==
    null
  );
}

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "audio",
  "video",
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="dialog"]',
  "dialog",
].join(",");

/**
 * Devuelve `true` cuando un atajo de práctica (Espacio/Flechas) debe
 * ignorarse porque el foco está en un control interactivo, un campo
 * editable o un diálogo (abierto o como ancestro del objetivo).
 * Devuelve `false` con foco no interactivo (cuerpo, tarjeta, encabezados).
 */
export function shouldIgnorePracticeShortcut(event: KeyboardEvent): boolean {
  const target = event.target as Element | null;

  if (
    target !== null &&
    typeof (target as Element).closest === "function" &&
    (target as Element).closest(INTERACTIVE_SELECTOR) !== null
  ) {
    return true;
  }

  if (
    target !== null &&
    typeof (target as HTMLElement).isContentEditable === "boolean" &&
    (target as HTMLElement).isContentEditable
  ) {
    return true;
  }

  return isPracticeDialogOpen(getEventDocument(event));
}
