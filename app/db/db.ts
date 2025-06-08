import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { Database } from "./types";

if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
  throw new Error("DATABASE_URL or DATABASE_AUTH_TOKEN is not set");
}

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
});
