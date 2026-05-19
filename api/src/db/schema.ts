import { pgTable, text, integer, real, boolean } from "drizzle-orm/pg-core";

export const babies = pgTable("babies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender"),
  bloodType: text("blood_type"),
  doctorName: text("doctor_name"),
  hospital: text("hospital"),
  createdAt: text("created_at").notNull(),
});

export const caregivers = pgTable("caregivers", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  name: text("name").notNull(),
  role: text("role").notNull(),
  permission: text("permission").notNull(),
  initials: text("initials"),
  createdAt: text("created_at").notNull(),
});

export const feedings = pgTable("feedings", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  type: text("type").notNull(),
  side: text("side"),
  durationSeconds: integer("duration_seconds"),
  amountMl: integer("amount_ml"),
  notes: text("notes"),
  loggedBy: text("logged_by"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  createdAt: text("created_at").notNull(),
});

export const sleeps = pgTable("sleeps", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  location: text("location"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  durationSeconds: integer("duration_seconds"),
  notes: text("notes"),
  loggedBy: text("logged_by"),
  createdAt: text("created_at").notNull(),
});

export const pumpingSessions = pgTable("pumping_sessions", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  leftMl: integer("left_ml"),
  rightMl: integer("right_ml"),
  totalMl: integer("total_ml"),
  durationSeconds: integer("duration_seconds"),
  storageType: text("storage_type"),
  pumpBrand: text("pump_brand"),
  notes: text("notes"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  loggedBy: text("logged_by"),
  createdAt: text("created_at").notNull(),
});

export const diaperChanges = pgTable("diaper_changes", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  type: text("type").notNull(),
  consistency: text("consistency"),
  color: text("color"),
  notes: text("notes"),
  loggedBy: text("logged_by"),
  changedAt: text("changed_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const baths = pgTable("baths", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  type: text("type"),
  waterTempC: real("water_temp_c"),
  durationMinutes: integer("duration_minutes"),
  soapUsed: boolean("soap_used"),
  soapType: text("soap_type"),
  notes: text("notes"),
  loggedBy: text("logged_by"),
  bathedAt: text("bathed_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const growthEntries = pgTable("growth_entries", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  weightG: integer("weight_g"),
  lengthCm: real("length_cm"),
  headCm: real("head_cm"),
  visitType: text("visit_type"),
  notes: text("notes"),
  loggedBy: text("logged_by"),
  measuredAt: text("measured_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const doctorVisits = pgTable("doctor_visits", {
  id: text("id").primaryKey(),
  babyId: text("baby_id")
    .notNull()
    .references(() => babies.id),
  doctorName: text("doctor_name"),
  hospital: text("hospital"),
  visitType: text("visit_type"),
  notes: text("notes"),
  vaccines: text("vaccines"),
  nextAppointment: text("next_appointment"),
  visitedAt: text("visited_at").notNull(),
  createdAt: text("created_at").notNull(),
});
