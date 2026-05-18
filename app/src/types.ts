export interface Baby {
  id: string;
  name: string;
  birthDate: string;
  gender?: string;
  bloodType?: string;
  doctorName?: string;
  hospital?: string;
  createdAt: string;
}

export interface Caregiver {
  id: string;
  babyId: string;
  name: string;
  role: string;
  permission: string;
  initials?: string;
  createdAt: string;
}

export interface Feeding {
  id: string;
  babyId: string;
  type: 'breast' | 'bottle' | 'formula' | 'solids';
  side?: 'left' | 'right' | 'both';
  durationSeconds?: number;
  amountMl?: number;
  notes?: string;
  loggedBy?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface Sleep {
  id: string;
  babyId: string;
  location?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  notes?: string;
  loggedBy?: string;
  createdAt: string;
}

export interface PumpingSession {
  id: string;
  babyId: string;
  leftMl: number;
  rightMl: number;
  totalMl: number;
  durationSeconds?: number;
  storageType?: 'fridge' | 'freezer' | 'feed_now';
  pumpBrand?: string;
  notes?: string;
  startedAt: string;
  endedAt?: string;
  loggedBy?: string;
  createdAt: string;
}

export interface DiaperChange {
  id: string;
  babyId: string;
  type: 'wet' | 'dirty' | 'mixed';
  consistency?: string;
  color?: string;
  notes?: string;
  loggedBy?: string;
  changedAt: string;
  createdAt: string;
}

export interface Bath {
  id: string;
  babyId: string;
  type?: string;
  waterTempC?: number;
  durationMinutes?: number;
  soapUsed?: boolean;
  soapType?: string;
  notes?: string;
  loggedBy?: string;
  bathedAt: string;
  createdAt: string;
}

export interface GrowthEntry {
  id: string;
  babyId: string;
  weightG?: number;
  lengthCm?: number;
  headCm?: number;
  visitType?: string;
  notes?: string;
  loggedBy?: string;
  measuredAt: string;
  createdAt: string;
}

export interface DoctorVisit {
  id: string;
  babyId: string;
  doctorName?: string;
  hospital?: string;
  visitType?: string;
  notes?: string;
  vaccines?: string;
  nextAppointment?: string;
  visitedAt: string;
  createdAt: string;
}

export interface TodayStats {
  feedCount: number;
  sleepCount: number;
  totalSleepSeconds: number;
  totalPumpedMl: number;
  diaperCount: number;
  wetDiapers: number;
  dirtyDiapers: number;
  lastFeed: Feeding | null;
  lastSleep: Sleep | null;
  activeSleep: Sleep | null;
  since: string;
}

export interface TimelineEvent {
  id: string;
  category: 'feeding' | 'sleep' | 'pumping' | 'diaper' | 'bath';
  eventTime: string;
  [key: string]: unknown;
}

export type Screen =
  | 'home' | 'timeline' | 'growth-chart' | 'profile'
  | 'feeding' | 'bottle' | 'sleep' | 'pumping'
  | 'diaper' | 'bath' | 'growth-entry' | 'insights';
