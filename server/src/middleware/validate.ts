import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/** Express middleware that validates req.body against a Zod schema. */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Validation failed", details: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };
}
