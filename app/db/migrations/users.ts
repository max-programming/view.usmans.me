import { Kysely } from "kysely";
import type { Database } from "../types";

export async function up(db: Kysely<Database>) {
  await db.schema
    .createTable("users")
    .addColumn("id", "integer", col => col.primaryKey())
    .addColumn("username", "text", col => col.notNull().unique())
    .addColumn("password", "text", col => col.notNull())
    .execute();
}

export async function down(db: Kysely<Database>) {
  await db.schema.dropTable("users").execute();
}
