/**
 * Shared validation and failure classification for the PDF tools (issue #100).
 *
 * Every PDF utility accepts arbitrary user files, so each one needs the same
 * two things: reject what obviously is not a usable PDF *before* handing it to
 * a parser, and turn the parser's own failures into something a user can act
 * on. Keeping both here means the tools cannot drift apart in what they
 * accept or how they explain a rejection.
 *
 * Nothing here reads file contents beyond the first few bytes, so validation
 * stays cheap even for very large files.
 */

export type PdfFailureKind =
  | 'empty'
  | 'not-pdf'
  | 'too-large'
  | 'encrypted'
  | 'corrupt'
  | 'no-pages'
  | 'generic';

/** Default ceiling; tools that stream page-by-page may raise it. */
export const DEFAULT_MAX_PDF_BYTES = 200 * 1024 * 1024;

const PDF_MAGIC = '%PDF-';

/**
 * Cheap pre-parse checks: size and the `%PDF-` signature. Returns the failure
 * kind, or null when the file looks usable.
 *
 * The signature check matters because a renamed .docx or an HTML error page
 * saved as .pdf otherwise reaches the parser and fails with an opaque message.
 */
export async function validatePdfFile(
  file: File,
  options: {maxBytes?: number} = {},
): Promise<PdfFailureKind | null> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_PDF_BYTES;

  if (file.size === 0) {
    return 'empty';
  }
  if (file.size > maxBytes) {
    return 'too-large';
  }

  const head = file.slice(0, PDF_MAGIC.length);
  if (typeof head.arrayBuffer !== 'function') {
    // No Blob.arrayBuffer in this environment (older Safari). The signature
    // check is defence in depth, not a security boundary, so skip it — failing
    // closed here would reject every valid PDF.
    return null;
  }

  try {
    const signature = new TextDecoder('latin1').decode(new Uint8Array(await head.arrayBuffer()));
    if (signature !== PDF_MAGIC) {
      return 'not-pdf';
    }
  } catch {
    // Unreadable slice: the file went away or the browser refused it.
    return 'corrupt';
  }

  return null;
}

/**
 * Maps a parser failure to a user-actionable class. pdf.js reports its own
 * cases through `name` (PasswordException, InvalidPDFException, …); other
 * libraries and generic throws fall back to message matching.
 */
export function classifyPdfError(error: unknown): PdfFailureKind {
  const name = (error as {name?: unknown} | null)?.name;
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (name === 'PasswordException' || /password|encrypted/i.test(message)) {
    return 'encrypted';
  }
  if (name === 'InvalidPDFException' || /invalid pdf|malformed|corrupt/i.test(message)) {
    return 'corrupt';
  }
  if (name === 'MissingPDFException' || /missing pdf|no pages|zero pages/i.test(message)) {
    return 'no-pages';
  }
  return 'generic';
}

/** i18n key describing a failure to the user. */
export function pdfErrorMessageKey(kind: PdfFailureKind): string {
  return `pdfErrors.${kind === 'not-pdf' ? 'notPdf' : kind === 'too-large' ? 'tooLarge' : kind === 'no-pages' ? 'noPages' : kind}`;
}
