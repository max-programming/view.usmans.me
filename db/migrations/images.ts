import { Kysely } from "kysely";
import type { Database } from "../types";

export async function up(db: Kysely<Database>) {
  await db.schema
    .createTable("images")
    .addColumn("id", "integer", col => col.primaryKey())
    .addColumn("title", "text", col => col.notNull())
    .addColumn("slug", "text", col => col.notNull().unique())
    .addColumn("description", "text")
    .addColumn("filePublicUrl", "text", col => col.notNull())
    .addColumn("visibility", "text", col => col.notNull().defaultTo("public"))
    .execute();
}

export async function down(db: Kysely<Database>) {
  await db.schema.dropTable("images").execute();
}
