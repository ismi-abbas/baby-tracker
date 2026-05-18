import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const babies = sqliteTable('babies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  birthDate: text('birth_date').notNull(),
  gender: text('gender'),
  bloodType: text('blood_type'),
  doctorName: text('doctor_name'),
  hospital: text('hospital'),
  createdAt: text('created_at').notNull(),
});

export const caregivers = sqliteTable('caregivers', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  permission: text('permission').notNull().default('view'),
  initials: text('initials'),
  createdAt: text('created_at').notNull(),
});

export const feedings = sqliteTable('feedings', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  type: text('type').notNull(), // breast | bottle | formula | solids
  side: text('side'),           // left | right | both
  durationSeconds: integer('duration_seconds'),
  amountMl: integer('amount_ml'),
  notes: text('notes'),
  loggedBy: text('logged_by'),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  createdAt: text('created_at').notNull(),
});

export const sleeps = sqliteTable('sleeps', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  location: text('location'),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  durationSeconds: integer('duration_seconds'),
  notes: text('notes'),
  loggedBy: text('logged_by'),
  createdAt: text('created_at').notNull(),
});

export const pumpingSessions = sqliteTable('pumping_sessions', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  leftMl: integer('left_ml').default(0),
  rightMl: integer('right_ml').default(0),
  totalMl: integer('total_ml').default(0),
  durationSeconds: integer('duration_seconds'),
  storageType: text('storage_type'), // fridge | freezer | feed_now
  pumpBrand: text('pump_brand'),
  notes: text('notes'),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  loggedBy: text('logged_by'),
  createdAt: text('created_at').notNull(),
});

export const diaperChanges = sqliteTable('diaper_changes', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  type: text('type').notNull(), // wet | dirty | mixed
  consistency: text('consistency'),
  color: text('color'),
  notes: text('notes'),
  loggedBy: text('logged_by'),
  changedAt: text('changed_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const baths = sqliteTable('baths', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  type: text('type'), // tub | sponge | shower
  waterTempC: real('water_temp_c'),
  durationMinutes: integer('duration_minutes'),
  soapUsed: integer('soap_used', { mode: 'boolean' }),
  soapType: text('soap_type'),
  notes: text('notes'),
  loggedBy: text('logged_by'),
  bathedAt: text('bathed_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const growthEntries = sqliteTable('growth_entries', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  weightG: integer('weight_g'),   // grams
  lengthCm: real('length_cm'),
  headCm: real('head_cm'),
  visitType: text('visit_type'), // home | doctor
  notes: text('notes'),
  loggedBy: text('logged_by'),
  measuredAt: text('measured_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const doctorVisits = sqliteTable('doctor_visits', {
  id: text('id').primaryKey(),
  babyId: text('baby_id').notNull().references(() => babies.id),
  doctorName: text('doctor_name'),
  hospital: text('hospital'),
  visitType: text('visit_type'),
  notes: text('notes'),
  vaccines: text('vaccines'),         // JSON array string
  nextAppointment: text('next_appointment'),
  visitedAt: text('visited_at').notNull(),
  createdAt: text('created_at').notNull(),
});
