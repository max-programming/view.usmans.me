import { useAppSession } from "@/lib/session";
import { createServerFn } from "@tanstack/react-start";

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await useAppSession();
    await session.clear();
  }
);
