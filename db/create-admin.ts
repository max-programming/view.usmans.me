import "dotenv/config";
import { db } from "./db";
import { hash } from "bcryptjs";

async function createAdmin() {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  console.log("Creating admin user...");
  const hashedPassword = await hash(process.env.ADMIN_PASSWORD, 10);
  await db
    .insertInto("users")
    .values({
      username: "admin",
      password: hashedPassword,
    })
    .execute();
  console.log("Admin user created successfully");
}

createAdmin();
