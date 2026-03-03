import { Request, Response, NextFunction } from "express";

/** Global error handler. */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
