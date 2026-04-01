import crypto from "crypto";

/**
 * Generate a random CSRF token.
 * Returns a 32-byte hex string (64 characters).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token using double-submit cookie pattern.
 * Token from cookie must match token from header.
 */
export function validateCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    // Length mismatch or other error
    return false;
  }
}
