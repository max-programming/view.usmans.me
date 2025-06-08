import { createMiddleware } from "@tanstack/react-start";
import { useAppSession } from "./lib/session";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useAppSession();
  if (!session.data.userId || !session.data.username) {
    throw new Error("Unauthorized");
  }
  return next();
});
