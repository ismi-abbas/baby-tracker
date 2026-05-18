import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as appSchema from "./db/schema";
import * as authSchema from "./db/auth-schema";

const fullSchema = { ...appSchema, ...authSchema };

export function createAuth(db: D1Database, secret: string, baseURL: string) {
  const drizzleDb = drizzle(db, { schema: fullSchema });
  return betterAuth({
    database: drizzleAdapter(drizzleDb, { provider: "sqlite" }),
    emailAndPassword: { enabled: true },
    secret,
    baseURL,
    trustedOrigins: ["http://localhost:5173", baseURL.replace("-api", "")],
  });
}
