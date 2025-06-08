import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/db";
import { compare } from "bcryptjs";
import { useAppSession } from "@/lib/session";

const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const loginUser = createServerFn({ method: "POST" })
  .validator(loginUserSchema)
  .handler(async ({ data }) => {
    const user = await db
      .selectFrom("users")
      .where("username", "=", data.username)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const session = await useAppSession();

    await session.update({
      userId: user.id,
      username: user.username,
    });

    return { success: true };
  });
