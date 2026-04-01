import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Require a valid JWT in the Authorization header. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Require the authenticated user to have the admin role. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

/** Require the authenticated user to have the admin or editor role. */
export function requireEditorOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin" && req.user?.role !== "editor") {
    res.status(403).json({ error: "Editor or admin access required" });
    return;
  }
  next();
}

/**
 * Check if user must change password before accessing protected resources.
 * Returns 403 if password change is required.
 * This middleware should be applied AFTER authenticate() and BEFORE other route handlers.
 *
 * Exempted routes (users can access these even if password change is required):
 * - /api/users/me/password (to allow password change)
 * - /api/auth/me (to allow fetching user profile)
 */
export function checkPasswordChangeRequired(req: Request, res: Response, next: NextFunction) {
  // Skip check for exempted routes
  const exemptedPaths = ['/api/users/me/password', '/api/auth/me'];
  if (exemptedPaths.includes(req.path)) {
    next();
    return;
  }

  if (req.user?.mustChangePassword === true) {
    res.status(403).json({
      error: "Password change required",
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "You must change your password before accessing this resource"
    });
    return;
  }
  next();
}
