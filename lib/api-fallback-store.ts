import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type UserRole = 'patient' | 'doctor' | 'admin'

interface AppUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: string
}

interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  time: string
  type: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string
  createdAt: string
  updatedAt: string
}

interface MedicalRecord {
  id: string
  patientId: string
  title: string
  type: string
  description: string
  createdAt: string
  updatedAt: string
}

interface AppNotification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface EmergencyAlert {
  id: string
  severity: string
  description: string
  location: string
  timestamp: string
  status: 'received' | 'acknowledged' | 'resolved'
}

type FallbackStore = {
  users: Record<string, AppUser>
  appointments: Record<string, Appointment>
  records: Record<string, MedicalRecord>
  notifications: Record<string, AppNotification>
  emergencyAlerts: Record<string, EmergencyAlert>
}

const STORE_FILE = path.join(process.cwd(), '.data', 'api-fallback-store.json')

let cachedStore: FallbackStore | null = null

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function nowIso(): string {
  return new Date().toISOString()
}

function ensureSeedData(store: FallbackStore) {
  if (Object.keys(store.users).length > 0) {
    return
  }

  const doctorId = randomUUID()
  const patientId = randomUUID()

  store.users[doctorId] = {
    id: doctorId,
    name: 'Dr. Demo',
    email: 'doctor@demo.local',
    password: 'password123',
    role: 'doctor',
    createdAt: nowIso(),
  }

  store.users[patientId] = {
    id: patientId,
    name: 'Patient Demo',
    email: 'patient@demo.local',
    password: 'password123',
    role: 'patient',
    createdAt: nowIso(),
  }
}

async function loadStore(): Promise<FallbackStore> {
  if (cachedStore) {
    return cachedStore
  }

  try {
    const raw = await readFile(STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<FallbackStore>
    cachedStore = {
      users: parsed.users ?? {},
      appointments: parsed.appointments ?? {},
      records: parsed.records ?? {},
      notifications: parsed.notifications ?? {},
      emergencyAlerts: parsed.emergencyAlerts ?? {},
    }
  } catch {
    cachedStore = {
      users: {},
      appointments: {},
      records: {},
      notifications: {},
      emergencyAlerts: {},
    }
  }

  ensureSeedData(cachedStore)
  return cachedStore
}

async function persistStore(store: FallbackStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

export async function loginOrCreateUser(email: string, password: string) {
  const store = await loadStore()
  const normalizedEmail = email.trim().toLowerCase()

  const existing = Object.values(store.users).find((user) => user.email.toLowerCase() === normalizedEmail)
  if (existing) {
    return clone(existing)
  }

  const id = randomUUID()
  const created: AppUser = {
    id,
    name: normalizedEmail.split('@')[0] || 'User',
    email: normalizedEmail,
    password,
    role: 'patient',
    createdAt: nowIso(),
  }

  store.users[id] = created
  await persistStore(store)
  return clone(created)
}

export async function registerAppUser(input: { name?: string; email?: string; password?: string }) {
  const store = await loadStore()
  const email = toStringValue(input.email).trim().toLowerCase()
  const password = toStringValue(input.password, 'password123')
  const name = toStringValue(input.name, email.split('@')[0] || 'User')

  const existing = Object.values(store.users).find((user) => user.email.toLowerCase() === email)
  if (existing) {
    return clone(existing)
  }

  const id = randomUUID()
  const created: AppUser = {
    id,
    name,
    email,
    password,
    role: 'patient',
    createdAt: nowIso(),
  }

  store.users[id] = created
  await persistStore(store)
  return clone(created)
}

export async function getCurrentUser() {
  const store = await loadStore()
  const first = Object.values(store.users)[0]
  return first ? clone(first) : null
}

export async function listAppointments(filter?: { patientId?: string; doctorId?: string }) {
  const store = await loadStore()
  const all = Object.values(store.appointments)

  const filtered = all.filter((appointment) => {
    if (filter?.patientId && appointment.patientId !== filter.patientId) {
      return false
    }
    if (filter?.doctorId && appointment.doctorId !== filter.doctorId) {
      return false
    }
    return true
  })

  return clone(filtered)
}

export async function createAppointment(data: Record<string, unknown>) {
  const store = await loadStore()
  const id = randomUUID()
  const timestamp = nowIso()

  const doctor = Object.values(store.users).find((user) => user.role === 'doctor')
  const patient = Object.values(store.users).find((user) => user.role === 'patient')

  const created: Appointment = {
    id,
    patientId: toStringValue(data.patientId, patient?.id ?? randomUUID()),
    doctorId: toStringValue(data.doctorId, doctor?.id ?? randomUUID()),
    date: toStringValue(data.date, timestamp.slice(0, 10)),
    time: toStringValue(data.time, '10:00'),
    type: toStringValue(data.type, 'consultation'),
    status: 'scheduled',
    notes: toStringValue(data.notes, ''),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  store.appointments[id] = created
  await persistStore(store)
  return clone(created)
}

export async function updateAppointment(id: string, updates: Record<string, unknown>) {
  const store = await loadStore()
  const existing = store.appointments[id]
  if (!existing) {
    return null
  }

  const updated: Appointment = {
    ...existing,
    date: updates.date !== undefined ? toStringValue(updates.date, existing.date) : existing.date,
    time: updates.time !== undefined ? toStringValue(updates.time, existing.time) : existing.time,
    type: updates.type !== undefined ? toStringValue(updates.type, existing.type) : existing.type,
    notes: updates.notes !== undefined ? toStringValue(updates.notes, existing.notes) : existing.notes,
    status:
      updates.status === 'scheduled' || updates.status === 'completed' || updates.status === 'cancelled'
        ? updates.status
        : existing.status,
    updatedAt: nowIso(),
  }

  store.appointments[id] = updated
  await persistStore(store)
  return clone(updated)
}

export async function deleteAppointment(id: string) {
  const store = await loadStore()
  const exists = Boolean(store.appointments[id])
  if (!exists) {
    return false
  }

  delete store.appointments[id]
  await persistStore(store)
  return true
}

export async function listRecords(patientId?: string) {
  const store = await loadStore()
  const all = Object.values(store.records)
  if (!patientId) {
    return clone(all)
  }

  return clone(all.filter((record) => record.patientId === patientId))
}

export async function createRecord(data: Record<string, unknown>) {
  const store = await loadStore()
  const patient = Object.values(store.users).find((user) => user.role === 'patient')
  const id = randomUUID()
  const timestamp = nowIso()

  const created: MedicalRecord = {
    id,
    patientId: toStringValue(data.patientId, patient?.id ?? randomUUID()),
    title: toStringValue(data.title, 'Medical Record'),
    type: toStringValue(data.type, 'note'),
    description: toStringValue(data.description, ''),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  store.records[id] = created
  await persistStore(store)
  return clone(created)
}

export async function getRecordById(recordId: string) {
  const store = await loadStore()
  const record = store.records[recordId]
  return record ? clone(record) : null
}

export async function listUserNotifications(userId: string) {
  const store = await loadStore()
  const notifications = Object.values(store.notifications).filter((item) => item.userId === userId)
  return clone(notifications)
}

export async function markNotificationRead(notificationId: string, read: boolean) {
  const store = await loadStore()
  const existing = store.notifications[notificationId]

  if (!existing) {
    return null
  }

  const updated: AppNotification = {
    ...existing,
    read,
  }

  store.notifications[notificationId] = updated
  await persistStore(store)
  return clone(updated)
}

export async function createNotification(data: {
  userId: string
  type: string
  title: string
  message: string
}) {
  const store = await loadStore()
  const id = randomUUID()

  const created: AppNotification = {
    id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    createdAt: nowIso(),
  }

  store.notifications[id] = created
  await persistStore(store)
  return clone(created)
}

export async function createEmergencyAlert(data: Record<string, unknown>) {
  const store = await loadStore()
  const id = randomUUID()

  const created: EmergencyAlert = {
    id,
    severity: toStringValue(data.severity, 'unknown'),
    description: toStringValue(data.description, ''),
    location: toStringValue(data.location, ''),
    timestamp: toStringValue(data.timestamp, nowIso()),
    status: 'received',
  }

  store.emergencyAlerts[id] = created
  await persistStore(store)
  return clone(created)
}

export async function getPatientDashboard(patientId: string) {
  const appointments = await listAppointments({ patientId })
  const records = await listRecords(patientId)

  return {
    patientId,
    stats: {
      appointments: appointments.length,
      records: records.length,
      upcomingAppointments: appointments.filter((item) => item.status === 'scheduled').length,
    },
  }
}

export async function getDoctorDashboard(doctorId: string) {
  const appointments = await listAppointments({ doctorId })
  const uniquePatients = new Set(appointments.map((item) => item.patientId))

  return {
    doctorId,
    stats: {
      appointments: appointments.length,
      activePatients: uniquePatients.size,
      completedAppointments: appointments.filter((item) => item.status === 'completed').length,
    },
  }
}

export async function getDoctorPatients(doctorId: string) {
  const store = await loadStore()
  const appointments = Object.values(store.appointments).filter((item) => item.doctorId === doctorId)
  const patientIds = new Set(appointments.map((item) => item.patientId))

  const patients = Array.from(patientIds)
    .map((id) => store.users[id])
    .filter((user): user is AppUser => Boolean(user))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }))

  return clone(patients)
}
