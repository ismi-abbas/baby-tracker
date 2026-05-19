import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as appSchema from "./db/schema";
import * as authSchema from "./db/auth-schema";

const fullSchema = { ...appSchema, ...authSchema };

// baseURL must be derived from the incoming request (protocol + host),
// not from a static env var — better-auth rejects requests when the
// configured baseURL host doesn't match the actual request host.
export function createAuth(
  databaseUrl: string,
  secret: string,
  baseURL: string,
  googleClientId: string,
  googleClientSecret: string,
  frontendUrl: string,
) {
  const db = drizzle(neon(databaseUrl), { schema: fullSchema });
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    },
    secret,
    baseURL,
    trustedOrigins: ["http://localhost:5173", frontendUrl],
  });
}
