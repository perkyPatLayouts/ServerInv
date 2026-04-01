import { Request, Response, NextFunction } from "express";
import { validateCsrfToken } from "../utils/csrf.js";

/**
 * CSRF protection middleware using double-submit cookie pattern.
 *
 * Validates that:
 * 1. CSRF token exists in cookie (csrf-token)
 * 2. CSRF token exists in header (X-CSRF-Token or x-csrf-token)
 * 3. Both tokens match (using timing-safe comparison)
 *
 * Only applies to state-changing methods: POST, PUT, PATCH, DELETE
 * Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF protection.
 *
 * This middleware should be applied AFTER authentication middleware.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Safe methods are not subject to CSRF
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  // Extract tokens
  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] as string | undefined;

  // Validate tokens match
  if (!validateCsrfToken(cookieToken, headerToken)) {
    res.status(403).json({
      error: "CSRF validation failed",
      code: "CSRF_INVALID",
      message: "Invalid or missing CSRF token"
    });
    return;
  }

  next();
}
