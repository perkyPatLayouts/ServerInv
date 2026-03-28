import { Router, Request, Response } from "express";
import { eq, lt, gt, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { db } from "../db/index.js";
import { users, passwordResetTokens } from "../db/schema/index.js";
import { hashPassword } from "../utils/password.js";
import { validate } from "../middleware/validate.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const router = Router();

/**
 * Generate a secure random token for password reset.
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a reset token for secure storage.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/** Validates that a token is exactly 64 hex characters. */
const TOKEN_FORMAT = /^[a-f0-9]{64}$/;

const resetPasswordSchema = z.object({
  token: z.string().regex(TOKEN_FORMAT, "Invalid token format"),
  newPassword: z.string().min(4, "Password must be at least 4 characters"),
});

/**
 * POST /api/auth/forgot-password
 * Request a password reset email.
 */
router.post("/forgot-password", validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // Always return success even if email doesn't exist (security best practice)
    if (!user) {
      res.json({ success: true, message: "If that email exists, a reset link has been sent." });
      return;
    }

    // Generate reset token
    const token = generateResetToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    // Store hashed token in database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: hashedToken,
      expiresAt,
    });

    // Send reset email
    const resetUrl = `${process.env.APP_URL || "http://localhost:5173"}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError: any) {
      console.error("Failed to send password reset email:", emailError);
      res.status(500).json({ error: "Failed to send reset email. Please try again later." });
      return;
    }

    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
});

/**
 * GET /api/auth/verify-reset-token
 * Verify if a reset token is valid.
 */
router.get("/verify-reset-token", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  if (!TOKEN_FORMAT.test(token)) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  try {
    const hashedToken = hashToken(token);

    // Find token and check if it's not expired
    const now = new Date();
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          gt(passwordResetTokens.expiresAt, now)
        )
      );

    if (!resetToken) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    res.json({ valid: true });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using a valid token.
 */
router.post("/reset-password", validate(resetPasswordSchema), async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    const hashedToken = hashToken(token);

    // Find token and check if it's not expired
    const now = new Date();
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          gt(passwordResetTokens.expiresAt, now)
        )
      );

    if (!resetToken) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    // Hash the new password
    const hash = await hashPassword(newPassword);

    // Update user password
    await db
      .update(users)
      .set({ password: hash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    // Delete the used token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

    // Delete any other tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

    res.json({ success: true, message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
});

/**
 * Cleanup expired tokens (should be called periodically, e.g., via cron)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const now = new Date();
    await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now));
    console.log("Expired password reset tokens cleaned up");
  } catch (error) {
    console.error("Failed to cleanup expired tokens:", error);
  }
}

export default router;
