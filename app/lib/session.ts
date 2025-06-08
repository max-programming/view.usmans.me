import { useSession } from "@tanstack/react-start/server";

interface SessionUser {
  userId: number;
  username: string;
}

export function useAppSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not set");
  }

  return useSession<SessionUser>({
    password: process.env.SESSION_SECRET,
  });
}
