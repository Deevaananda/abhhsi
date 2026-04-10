import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  BioRoutineSettings,
  BioSyncProfile,
  BioSyncUserState,
  BloodReport,
  LabBooking,
  LifestyleProfile,
  MoodLog,
  WearableSnapshot,
} from '@/lib/biosync/types'

const LOCAL_STORE_ROOT =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? '/tmp'
    : path.join(process.cwd(), '.data')

const LOCAL_STORE_FILE = path.join(LOCAL_STORE_ROOT, 'biosync-store.json')

const DB_FALLBACK_PATTERNS = [
  'Environment variable not found: DATABASE_URL',
  'Authentication failed against database server',
  "Can't reach database server",
  'Connection refused',
  '@prisma/client did not initialize yet',
  'Prisma Client could not locate the Query Engine',
  '.prisma/client',
  'Error validating datasource `db`',
  'prisma generate',
  'P1000',
  'P1001',
  'P1010',
]

type LocalStore = {
  users: Record<string, BioSyncUserState>
}

let cachedStore: LocalStore | null = null
let forceLocalStore = !process.env.DATABASE_URL
let fallbackReasonLogged = false

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toIsoDate(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function shouldFallbackForError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return DB_FALLBACK_PATTERNS.some((pattern) => message.includes(pattern))
}

export function shouldUseLocalStore(error?: unknown): boolean {
  if (error && shouldFallbackForError(error)) {
    forceLocalStore = true

    if (!fallbackReasonLogged) {
      console.warn('[BioSync] Falling back to local JSON store because Postgres is unavailable.')
      fallbackReasonLogged = true
    }
  }

  return forceLocalStore
}

async function loadLocalStore(): Promise<LocalStore> {
  if (cachedStore) {
    return cachedStore
  }

  try {
    const raw = await readFile(LOCAL_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<LocalStore>
    cachedStore = {
      users: parsed.users ?? {},
    }
  } catch {
    cachedStore = { users: {} }
  }

  return cachedStore
}

async function persistLocalStore(store: LocalStore): Promise<void> {
  await mkdir(path.dirname(LOCAL_STORE_FILE), { recursive: true })
  await writeFile(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

function normalizeState(state: BioSyncUserState): BioSyncUserState {
  const now = new Date().toISOString()

  return {
    ...state,
    profile: {
      ...state.profile,
      createdAt: state.profile.createdAt ?? now,
      updatedAt: state.profile.updatedAt ?? now,
    },
    bloodReports: state.bloodReports ?? [],
    wearables: state.wearables ?? [],
    moodLogs: state.moodLogs ?? [],
    labBookings: state.labBookings ?? [],
    bioRoutineSettings:
      state.bioRoutineSettings ?? {
        enabled: false,
        updatedAt: now,
      },
    createdAt: state.createdAt ?? now,
    updatedAt: state.updatedAt ?? now,
  }
}

function withUpdatedTimestamps(state: BioSyncUserState): BioSyncUserState {
  const now = new Date().toISOString()
  return {
    ...state,
    profile: {
      ...state.profile,
      updatedAt: now,
    },
    updatedAt: now,
  }
}

async function getOrCreateUserState(state: BioSyncUserState): Promise<BioSyncUserState> {
  const store = await loadLocalStore()
  const existing = store.users[state.profile.id]

  if (existing) {
    return normalizeState(existing)
  }

  const normalized = normalizeState(state)
  store.users[state.profile.id] = normalized
  await persistLocalStore(store)
  return normalized
}

export async function createLocalBioSyncUser(
  input: Omit<BioSyncProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BioSyncUserState> {
  const store = await loadLocalStore()
  const now = new Date().toISOString()
  const id = randomUUID()

  const state: BioSyncUserState = {
    profile: {
      id,
      name: input.name,
      age: input.age,
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      activityLevel: input.activityLevel,
      createdAt: now,
      updatedAt: now,
    },
    bloodReports: [],
    wearables: [],
    moodLogs: [],
    bioRoutineSettings: {
      enabled: false,
      updatedAt: now,
    },
    labBookings: [],
    createdAt: now,
    updatedAt: now,
  }

  store.users[id] = state
  await persistLocalStore(store)
  return deepClone(state)
}

export async function getLocalBioSyncUserState(
  userId: string
): Promise<BioSyncUserState | undefined> {
  const store = await loadLocalStore()
  const state = store.users[userId]

  if (!state) {
    return undefined
  }

  return deepClone(normalizeState(state))
}

export async function saveLocalBioSyncUserState(
  state: BioSyncUserState
): Promise<BioSyncUserState> {
  const store = await loadLocalStore()
  const normalized = normalizeState(state)
  const updated = withUpdatedTimestamps(normalized)

  store.users[state.profile.id] = updated
  await persistLocalStore(store)
  return deepClone(updated)
}

export async function addLocalBloodReport(
  state: BioSyncUserState,
  report: Omit<BloodReport, 'id' | 'uploadedAt'>
): Promise<BloodReport> {
  const store = await loadLocalStore()
  const existing = await getOrCreateUserState(state)
  const now = new Date().toISOString()

  const created: BloodReport = {
    id: randomUUID(),
    source: report.source,
    reportDate: toIsoDate(report.reportDate),
    uploadedAt: now,
    markers: report.markers,
    pdfFileName: report.pdfFileName,
    pdfUrl: report.pdfUrl,
  }

  const nextState = withUpdatedTimestamps({
    ...existing,
    bloodReports: [created, ...existing.bloodReports],
  })

  store.users[state.profile.id] = nextState
  await persistLocalStore(store)
  return deepClone(created)
}

export async function setLocalLifestyle(
  state: BioSyncUserState,
  lifestyle: Omit<LifestyleProfile, 'updatedAt'>
): Promise<LifestyleProfile> {
  const store = await loadLocalStore()
  const existing = await getOrCreateUserState(state)
  const now = new Date().toISOString()

  const updatedLifestyle: LifestyleProfile = {
    diet: lifestyle.diet,
    allergies: lifestyle.allergies,
    updatedAt: now,
  }

  const nextState = withUpdatedTimestamps({
    ...existing,
    lifestyle: updatedLifestyle,
  })

  store.users[state.profile.id] = nextState
  await persistLocalStore(store)
  return deepClone(updatedLifestyle)
}

export async function addLocalWearableSnapshot(
  state: BioSyncUserState,
  snapshot: Omit<WearableSnapshot, 'id' | 'syncedAt'>
): Promise<WearableSnapshot> {
  const store = await loadLocalStore()
  const existing = await getOrCreateUserState(state)
  const now = new Date().toISOString()

  const created: WearableSnapshot = {
    id: randomUUID(),
    date: toIsoDate(snapshot.date),
    steps: snapshot.steps,
    restingHeartRate: snapshot.restingHeartRate,
    hrv: snapshot.hrv,
    sleepHours: snapshot.sleepHours,
    workoutMinutes: snapshot.workoutMinutes,
    caloriesBurned: snapshot.caloriesBurned,
    waterIntakeMl: snapshot.waterIntakeMl,
    syncedAt: now,
  }

  const nextState = withUpdatedTimestamps({
    ...existing,
    wearables: [created, ...existing.wearables],
  })

  store.users[state.profile.id] = nextState
  await persistLocalStore(store)
  return deepClone(created)
}

export async function addLocalMoodLog(
  state: BioSyncUserState,
  moodLog: Omit<MoodLog, 'id' | 'createdAt'>
): Promise<MoodLog> {
  const store = await loadLocalStore()
  const existing = await getOrCreateUserState(state)
  const now = new Date().toISOString()

  const created: MoodLog = {
    id: randomUUID(),
    date: toIsoDate(moodLog.date),
    mood: moodLog.mood,
    note: moodLog.note,
    createdAt: now,
  }

  const nextState = withUpdatedTimestamps({
    ...existing,
    moodLogs: [created, ...existing.moodLogs],
  })

  store.users[state.profile.id] = nextState
  await persistLocalStore(store)
  return deepClone(created)
}

export async function setLocalBioRoutineSettings(
  state: BioSyncUserState,
  settings: Pick<BioRoutineSettings, 'enabled' | 'wakeTime'>
): Promise<BioRoutineSettings> {
  const store = await loadLocalStore()
  const existing = await getOrCreateUserState(state)
  const now = new Date().toISOString()

  const updatedSettings: BioRoutineSettings = {
    enabled: settings.enabled,
    wakeTime: settings.wakeTime,
    updatedAt: now,
  }

  const nextState = withUpdatedTimestamps({
    ...existing,
    bioRoutineSettings: updatedSettings,
  })

  store.users[state.profile.id] = nextState
  await persistLocalStore(store)
  return deepClone(updatedSettings)
}

export async function addLocalLabBooking(
  state: BioSyncUserState,
  booking: Omit<LabBooking, 'id' | 'createdAt' | 'status'>
): Promise<LabBooking> {
  const store = await loadLocalStore()
  const existing = await getOrCreateUserState(state)
  const now = new Date().toISOString()

  const created: LabBooking = {
    id: randomUUID(),
    preferredDate: toIsoDate(booking.preferredDate),
    labName: booking.labName,
    status: 'requested',
    createdAt: now,
  }

  const nextState = withUpdatedTimestamps({
    ...existing,
    labBookings: [created, ...existing.labBookings],
  })

  store.users[state.profile.id] = nextState
  await persistLocalStore(store)
  return deepClone(created)
}
