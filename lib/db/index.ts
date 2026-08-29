import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof createDb>;

function createDb() {
  return drizzle(neon(env.DATABASE_URL), { schema });
}

let instance: Database | undefined;

/**
 * Created lazily so that importing this module during the build (for route
 * collection) does not require DATABASE_URL to be set.
 */
export function getDb(): Database {
  instance ??= createDb();
  return instance;
}
