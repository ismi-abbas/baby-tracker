import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import * as appSchema from "./db/schema";
import * as authSchema from "./db/auth-schema";
import {
  babies,
  caregivers,
  feedings,
  sleeps,
  pumpingSessions,
  diaperChanges,
  baths,
  growthEntries,
  doctorVisits,
} from "./db/schema";
import { createAuth } from "./auth";

const fullSchema = { ...appSchema, ...authSchema };

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── Auth routes ──────────────────────────────────────────────────

app.on(["GET", "POST"], "/api/auth/**", async (c) => {
  const auth = createAuth(
    c.env.DB,
    c.env.BETTER_AUTH_SECRET,
    c.env.BETTER_AUTH_URL,
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
  );
  return auth.handler(c.req.raw);
});

// ─── Auth middleware (protects all /api/babies/* routes) ──────────

app.use("/api/babies/*", async (c, next) => {
  const auth = createAuth(
    c.env.DB,
    c.env.BETTER_AUTH_SECRET,
    c.env.BETTER_AUTH_URL,
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
  );
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "unauthorized" }, 401);
  c.set("userId", session.user.id);
  await next();
});

app.use("/api/seed", async (c, next) => {
  const auth = createAuth(
    c.env.DB,
    c.env.BETTER_AUTH_SECRET,
    c.env.BETTER_AUTH_URL,
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
  );
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "unauthorized" }, 401);
  await next();
});

// ─── Babies ──────────────────────────────────────────────────────

app.get("/api/babies", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db.select().from(babies).orderBy(desc(babies.createdAt));
  return c.json(rows);
});

app.get("/api/babies/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const [row] = await db
    .select()
    .from(babies)
    .where(eq(babies.id, c.req.param("id")));
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});

app.post("/api/babies", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), ...body, createdAt: now() };
  await db.insert(babies).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(babies)
    .set(body)
    .where(eq(babies.id, c.req.param("id")));
  const [row] = await db
    .select()
    .from(babies)
    .where(eq(babies.id, c.req.param("id")));
  return c.json(row);
});

// ─── Caregivers ───────────────────────────────────────────────────

app.get("/api/babies/:babyId/caregivers", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(caregivers)
    .where(eq(caregivers.babyId, c.req.param("babyId")));
  return c.json(rows);
});

app.post("/api/babies/:babyId/caregivers", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(caregivers).values(row);
  return c.json(row, 201);
});

app.delete("/api/babies/:babyId/caregivers/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(caregivers)
    .where(and(eq(caregivers.id, c.req.param("id")), eq(caregivers.babyId, c.req.param("babyId"))));
  return c.json({ ok: true });
});

// ─── Feedings ─────────────────────────────────────────────────────

app.get("/api/babies/:babyId/feedings", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const limit = Number(c.req.query("limit") ?? 50);
  const rows = await db
    .select()
    .from(feedings)
    .where(eq(feedings.babyId, c.req.param("babyId")))
    .orderBy(desc(feedings.startedAt))
    .limit(limit);
  return c.json(rows);
});

app.post("/api/babies/:babyId/feedings", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(feedings).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/feedings/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(feedings)
    .set(body)
    .where(and(eq(feedings.id, c.req.param("id")), eq(feedings.babyId, c.req.param("babyId"))));
  const [row] = await db
    .select()
    .from(feedings)
    .where(eq(feedings.id, c.req.param("id")));
  return c.json(row);
});

app.delete("/api/babies/:babyId/feedings/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(feedings)
    .where(and(eq(feedings.id, c.req.param("id")), eq(feedings.babyId, c.req.param("babyId"))));
  return c.json({ ok: true });
});

// ─── Sleeps ────────────────────────────────────────────────────────

app.get("/api/babies/:babyId/sleeps", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(sleeps)
    .where(eq(sleeps.babyId, c.req.param("babyId")))
    .orderBy(desc(sleeps.startedAt))
    .limit(Number(c.req.query("limit") ?? 50));
  return c.json(rows);
});

app.post("/api/babies/:babyId/sleeps", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(sleeps).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/sleeps/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(sleeps)
    .set(body)
    .where(and(eq(sleeps.id, c.req.param("id")), eq(sleeps.babyId, c.req.param("babyId"))));
  const [row] = await db
    .select()
    .from(sleeps)
    .where(eq(sleeps.id, c.req.param("id")));
  return c.json(row);
});

app.delete("/api/babies/:babyId/sleeps/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(sleeps)
    .where(and(eq(sleeps.id, c.req.param("id")), eq(sleeps.babyId, c.req.param("babyId"))));
  return c.json({ ok: true });
});

// ─── Pumping ───────────────────────────────────────────────────────

app.get("/api/babies/:babyId/pumping", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(pumpingSessions)
    .where(eq(pumpingSessions.babyId, c.req.param("babyId")))
    .orderBy(desc(pumpingSessions.startedAt))
    .limit(Number(c.req.query("limit") ?? 50));
  return c.json(rows);
});

app.post("/api/babies/:babyId/pumping", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const left = body.leftMl ?? 0;
  const right = body.rightMl ?? 0;
  const row = {
    id: uid(),
    babyId: c.req.param("babyId"),
    ...body,
    leftMl: left,
    rightMl: right,
    totalMl: left + right,
    createdAt: now(),
  };
  await db.insert(pumpingSessions).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/pumping/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  if (body.leftMl !== undefined || body.rightMl !== undefined) {
    const [existing] = await db
      .select()
      .from(pumpingSessions)
      .where(eq(pumpingSessions.id, c.req.param("id")));
    const left = body.leftMl ?? existing?.leftMl ?? 0;
    const right = body.rightMl ?? existing?.rightMl ?? 0;
    body.totalMl = left + right;
  }
  await db
    .update(pumpingSessions)
    .set(body)
    .where(
      and(
        eq(pumpingSessions.id, c.req.param("id")),
        eq(pumpingSessions.babyId, c.req.param("babyId")),
      ),
    );
  const [row] = await db
    .select()
    .from(pumpingSessions)
    .where(eq(pumpingSessions.id, c.req.param("id")));
  return c.json(row);
});

app.delete("/api/babies/:babyId/pumping/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(pumpingSessions)
    .where(
      and(
        eq(pumpingSessions.id, c.req.param("id")),
        eq(pumpingSessions.babyId, c.req.param("babyId")),
      ),
    );
  return c.json({ ok: true });
});

// ─── Diapers ───────────────────────────────────────────────────────

app.get("/api/babies/:babyId/diapers", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(diaperChanges)
    .where(eq(diaperChanges.babyId, c.req.param("babyId")))
    .orderBy(desc(diaperChanges.changedAt))
    .limit(Number(c.req.query("limit") ?? 50));
  return c.json(rows);
});

app.post("/api/babies/:babyId/diapers", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(diaperChanges).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/diapers/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(diaperChanges)
    .set(body)
    .where(
      and(eq(diaperChanges.id, c.req.param("id")), eq(diaperChanges.babyId, c.req.param("babyId"))),
    );
  const [row] = await db
    .select()
    .from(diaperChanges)
    .where(eq(diaperChanges.id, c.req.param("id")));
  return c.json(row);
});

app.delete("/api/babies/:babyId/diapers/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(diaperChanges)
    .where(
      and(eq(diaperChanges.id, c.req.param("id")), eq(diaperChanges.babyId, c.req.param("babyId"))),
    );
  return c.json({ ok: true });
});

// ─── Baths ─────────────────────────────────────────────────────────

app.get("/api/babies/:babyId/baths", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(baths)
    .where(eq(baths.babyId, c.req.param("babyId")))
    .orderBy(desc(baths.bathedAt))
    .limit(Number(c.req.query("limit") ?? 50));
  return c.json(rows);
});

app.post("/api/babies/:babyId/baths", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(baths).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/baths/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(baths)
    .set(body)
    .where(and(eq(baths.id, c.req.param("id")), eq(baths.babyId, c.req.param("babyId"))));
  const [row] = await db
    .select()
    .from(baths)
    .where(eq(baths.id, c.req.param("id")));
  return c.json(row);
});

app.delete("/api/babies/:babyId/baths/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(baths)
    .where(and(eq(baths.id, c.req.param("id")), eq(baths.babyId, c.req.param("babyId"))));
  return c.json({ ok: true });
});

// ─── Growth ─────────────────────────────────────────────────────────

app.get("/api/babies/:babyId/growth", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(growthEntries)
    .where(eq(growthEntries.babyId, c.req.param("babyId")))
    .orderBy(desc(growthEntries.measuredAt))
    .limit(Number(c.req.query("limit") ?? 100));
  return c.json(rows);
});

app.post("/api/babies/:babyId/growth", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(growthEntries).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/growth/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(growthEntries)
    .set(body)
    .where(
      and(eq(growthEntries.id, c.req.param("id")), eq(growthEntries.babyId, c.req.param("babyId"))),
    );
  const [row] = await db
    .select()
    .from(growthEntries)
    .where(eq(growthEntries.id, c.req.param("id")));
  return c.json(row);
});

app.delete("/api/babies/:babyId/growth/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  await db
    .delete(growthEntries)
    .where(
      and(eq(growthEntries.id, c.req.param("id")), eq(growthEntries.babyId, c.req.param("babyId"))),
    );
  return c.json({ ok: true });
});

// ─── Doctor Visits ─────────────────────────────────────────────────

app.get("/api/babies/:babyId/visits", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const rows = await db
    .select()
    .from(doctorVisits)
    .where(eq(doctorVisits.babyId, c.req.param("babyId")))
    .orderBy(desc(doctorVisits.visitedAt));
  return c.json(rows);
});

app.post("/api/babies/:babyId/visits", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  const row = { id: uid(), babyId: c.req.param("babyId"), ...body, createdAt: now() };
  await db.insert(doctorVisits).values(row);
  return c.json(row, 201);
});

app.put("/api/babies/:babyId/visits/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const body = await c.req.json();
  await db
    .update(doctorVisits)
    .set(body)
    .where(
      and(eq(doctorVisits.id, c.req.param("id")), eq(doctorVisits.babyId, c.req.param("babyId"))),
    );
  const [row] = await db
    .select()
    .from(doctorVisits)
    .where(eq(doctorVisits.id, c.req.param("id")));
  return c.json(row);
});

// ─── Timeline ──────────────────────────────────────────────────────

app.get("/api/babies/:babyId/timeline", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const babyId = c.req.param("babyId");
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const [feedRows, sleepRows, pumpRows, diaperRows, bathRows] = await Promise.all([
    db
      .select()
      .from(feedings)
      .where(
        and(
          eq(feedings.babyId, babyId),
          gte(feedings.startedAt, dayStart),
          sql`${feedings.startedAt} <= ${dayEnd}`,
        ),
      )
      .orderBy(desc(feedings.startedAt)),
    db
      .select()
      .from(sleeps)
      .where(
        and(
          eq(sleeps.babyId, babyId),
          gte(sleeps.startedAt, dayStart),
          sql`${sleeps.startedAt} <= ${dayEnd}`,
        ),
      )
      .orderBy(desc(sleeps.startedAt)),
    db
      .select()
      .from(pumpingSessions)
      .where(
        and(
          eq(pumpingSessions.babyId, babyId),
          gte(pumpingSessions.startedAt, dayStart),
          sql`${pumpingSessions.startedAt} <= ${dayEnd}`,
        ),
      )
      .orderBy(desc(pumpingSessions.startedAt)),
    db
      .select()
      .from(diaperChanges)
      .where(
        and(
          eq(diaperChanges.babyId, babyId),
          gte(diaperChanges.changedAt, dayStart),
          sql`${diaperChanges.changedAt} <= ${dayEnd}`,
        ),
      )
      .orderBy(desc(diaperChanges.changedAt)),
    db
      .select()
      .from(baths)
      .where(
        and(
          eq(baths.babyId, babyId),
          gte(baths.bathedAt, dayStart),
          sql`${baths.bathedAt} <= ${dayEnd}`,
        ),
      )
      .orderBy(desc(baths.bathedAt)),
  ]);

  const events = [
    ...feedRows.map((r) => ({ ...r, category: "feeding", eventTime: r.startedAt })),
    ...sleepRows.map((r) => ({ ...r, category: "sleep", eventTime: r.startedAt })),
    ...pumpRows.map((r) => ({ ...r, category: "pumping", eventTime: r.startedAt })),
    ...diaperRows.map((r) => ({ ...r, category: "diaper", eventTime: r.changedAt })),
    ...bathRows.map((r) => ({ ...r, category: "bath", eventTime: r.bathedAt })),
  ].sort((a, b) => b.eventTime.localeCompare(a.eventTime));

  return c.json(events);
});

// ─── Today's Stats ──────────────────────────────────────────────────

app.get("/api/babies/:babyId/stats/today", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const babyId = c.req.param("babyId");
  const start = todayStart();

  const [feedRows, sleepRows, pumpRows, diaperRows] = await Promise.all([
    db
      .select()
      .from(feedings)
      .where(and(eq(feedings.babyId, babyId), gte(feedings.startedAt, start))),
    db
      .select()
      .from(sleeps)
      .where(and(eq(sleeps.babyId, babyId), gte(sleeps.startedAt, start))),
    db
      .select()
      .from(pumpingSessions)
      .where(and(eq(pumpingSessions.babyId, babyId), gte(pumpingSessions.startedAt, start))),
    db
      .select()
      .from(diaperChanges)
      .where(and(eq(diaperChanges.babyId, babyId), gte(diaperChanges.changedAt, start))),
  ]);

  const totalSleepSeconds = sleepRows.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);
  const totalPumpedMl = pumpRows.reduce((s, r) => s + (r.totalMl ?? 0), 0);
  const wetDiapers = diaperRows.filter((d) => d.type === "wet" || d.type === "mixed").length;
  const dirtyDiapers = diaperRows.filter((d) => d.type === "dirty" || d.type === "mixed").length;
  const lastFeed = feedRows.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const lastSleep = sleepRows.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const activeSleep = sleepRows.find((s) => !s.endedAt);

  return c.json({
    feedCount: feedRows.length,
    sleepCount: sleepRows.length,
    totalSleepSeconds,
    totalPumpedMl,
    diaperCount: diaperRows.length,
    wetDiapers,
    dirtyDiapers,
    lastFeed: lastFeed ?? null,
    lastSleep: lastSleep ?? null,
    activeSleep: activeSleep ?? null,
    since: start,
  });
});

// ─── Weekly Stats ───────────────────────────────────────────────────

app.get("/api/babies/:babyId/stats/weekly", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const babyId = c.req.param("babyId");
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [feedRows, sleepRows, pumpRows, diaperRows] = await Promise.all([
    db
      .select()
      .from(feedings)
      .where(and(eq(feedings.babyId, babyId), gte(feedings.startedAt, weekAgo))),
    db
      .select()
      .from(sleeps)
      .where(and(eq(sleeps.babyId, babyId), gte(sleeps.startedAt, weekAgo))),
    db
      .select()
      .from(pumpingSessions)
      .where(and(eq(pumpingSessions.babyId, babyId), gte(pumpingSessions.startedAt, weekAgo))),
    db
      .select()
      .from(diaperChanges)
      .where(and(eq(diaperChanges.babyId, babyId), gte(diaperChanges.changedAt, weekAgo))),
  ]);

  return c.json({
    avgFeedsPerDay: Math.round((feedRows.length / 7) * 10) / 10,
    pumpingSessions: pumpRows.length,
    totalPumpedMl: pumpRows.reduce((s, r) => s + (r.totalMl ?? 0), 0),
    avgWetDiapersPerDay:
      Math.round(
        (diaperRows.filter((d) => d.type === "wet" || d.type === "mixed").length / 7) * 10,
      ) / 10,
    longestSleepSeconds: Math.max(0, ...sleepRows.map((s) => s.durationSeconds ?? 0)),
    totalSleepSeconds: sleepRows.reduce((s, r) => s + (r.durationSeconds ?? 0), 0),
  });
});

// ─── Seed ──────────────────────────────────────────────────────────

app.post("/api/seed", async (c) => {
  const db = drizzle(c.env.DB, { schema: fullSchema });
  const babyId = "saif-hakimi";
  const existing = await db.select().from(babies).where(eq(babies.id, babyId));
  if (existing.length > 0) return c.json({ ok: true, seeded: false });

  await db.insert(babies).values({
    id: babyId,
    name: "Saif Hakimi",
    birthDate: "2026-02-23",
    gender: "boy",
    bloodType: "O+",
    doctorName: "Dr. Tan",
    hospital: "KK Hospital",
    createdAt: now(),
  });

  await db.insert(caregivers).values([
    {
      id: uid(),
      babyId,
      name: "Hakim",
      role: "Dad",
      permission: "admin",
      initials: "H",
      createdAt: now(),
    },
    {
      id: uid(),
      babyId,
      name: "Lina",
      role: "Mom",
      permission: "admin",
      initials: "L",
      createdAt: now(),
    },
    {
      id: uid(),
      babyId,
      name: "Mama Rosie",
      role: "Grandma",
      permission: "view",
      initials: "R",
      createdAt: now(),
    },
  ]);

  await db.insert(doctorVisits).values({
    id: uid(),
    babyId,
    doctorName: "Dr. Tan",
    hospital: "KK Hospital",
    visitType: "3-month checkup",
    notes: "Healthy gains. Continue mixed feeding. Watch for tongue-tie follow-up at 4mo.",
    vaccines: JSON.stringify(["DTaP", "Hib", "IPV", "PCV"]),
    nextAppointment: "2026-05-28T10:00:00.000Z",
    visitedAt: "2026-04-28T09:00:00.000Z",
    createdAt: now(),
  });

  await db.insert(growthEntries).values([
    {
      id: uid(),
      babyId,
      weightG: 3400,
      lengthCm: 50,
      headCm: 34,
      visitType: "doctor",
      measuredAt: "2026-02-23T08:00:00.000Z",
      createdAt: now(),
    },
    {
      id: uid(),
      babyId,
      weightG: 4200,
      lengthCm: 54,
      headCm: 36,
      visitType: "home",
      measuredAt: "2026-03-23T08:00:00.000Z",
      createdAt: now(),
    },
    {
      id: uid(),
      babyId,
      weightG: 4800,
      lengthCm: 56,
      headCm: 37.5,
      visitType: "home",
      measuredAt: "2026-04-23T08:00:00.000Z",
      createdAt: now(),
    },
    {
      id: uid(),
      babyId,
      weightG: 5400,
      lengthCm: 58,
      headCm: 39.5,
      visitType: "doctor",
      measuredAt: "2026-05-12T09:00:00.000Z",
      createdAt: now(),
    },
  ]);

  return c.json({ ok: true, seeded: true });
});

export default app;
