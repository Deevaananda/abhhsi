import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type SettingsGender = 'male' | 'female' | 'other' | ''

export interface UserSettingsProfile {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: SettingsGender
  bloodType: string
  bio: string
  createdAt: string
  updatedAt: string
}

type UserProfileStore = {
  profiles: Record<string, UserSettingsProfile>
}

const STORE_ROOT =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? '/tmp'
    : path.join(process.cwd(), '.data')

const STORE_FILE = path.join(STORE_ROOT, 'user-profiles.json')

let cachedStore: UserProfileStore | null = null

function emptyProfile(now: string): UserSettingsProfile {
  return {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    bio: '',
    createdAt: now,
    updatedAt: now,
  }
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeGender(value: unknown): SettingsGender {
  if (value === 'male' || value === 'female' || value === 'other') {
    return value
  }
  return ''
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function loadStore(): Promise<UserProfileStore> {
  if (cachedStore) {
    return cachedStore
  }

  try {
    const raw = await readFile(STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<UserProfileStore>
    cachedStore = {
      profiles: parsed.profiles ?? {},
    }
  } catch {
    cachedStore = {
      profiles: {},
    }
  }

  return cachedStore
}

async function persistStore(store: UserProfileStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

export async function getStoredUserProfile(
  userId: string
): Promise<UserSettingsProfile | undefined> {
  const store = await loadStore()
  const profile = store.profiles[userId]
  return profile ? clone(profile) : undefined
}

export async function upsertStoredUserProfile(
  userId: string,
  updates: Partial<UserSettingsProfile>
): Promise<UserSettingsProfile> {
  const store = await loadStore()
  const now = new Date().toISOString()
  const current = store.profiles[userId] ?? emptyProfile(now)

  const nextProfile: UserSettingsProfile = {
    ...current,
    fullName:
      updates.fullName !== undefined ? sanitizeText(updates.fullName) : current.fullName,
    email: updates.email !== undefined ? sanitizeText(updates.email) : current.email,
    phone: updates.phone !== undefined ? sanitizeText(updates.phone) : current.phone,
    dateOfBirth:
      updates.dateOfBirth !== undefined
        ? sanitizeText(updates.dateOfBirth)
        : current.dateOfBirth,
    gender:
      updates.gender !== undefined ? sanitizeGender(updates.gender) : current.gender,
    bloodType:
      updates.bloodType !== undefined ? sanitizeText(updates.bloodType) : current.bloodType,
    bio: updates.bio !== undefined ? sanitizeText(updates.bio) : current.bio,
    updatedAt: now,
  }

  store.profiles[userId] = nextProfile
  await persistStore(store)

  return clone(nextProfile)
}
