import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../config/env.js";
import * as schema from "./schema.js";

let client: postgres.Sql | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to the database");
  }

  client ??= postgres(env.databaseUrl, {
    max: 5,
  });
  database ??= drizzle(client, { schema });

  return database;
}
