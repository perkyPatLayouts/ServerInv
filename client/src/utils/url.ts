/**
 * Validates that a URL uses a safe protocol (http or https).
 * Returns the URL if safe, or undefined if the protocol is dangerous (e.g. javascript:).
 * Automatically prepends https:// if no protocol is present.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // If no protocol, prepend https://
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return withProtocol;
    }
  } catch {
    // Invalid URL
  }
  return undefined;
}
