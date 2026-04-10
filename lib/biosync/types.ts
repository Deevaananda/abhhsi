export type Gender = 'male' | 'female' | 'other'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'athlete'

export type DietType = 'veg' | 'vegan' | 'eggetarian' | 'non-veg'

export type MoodLevel =
  | 'happy'
  | 'calm'
  | 'neutral'
  | 'anxious'
  | 'stressed'
  | 'overwhelmed'

export type BloodReportSource = 'manual' | 'pdf'

export type MarkerStatus = 'low' | 'normal' | 'high'

export type MarkerSeverity = 'mild' | 'moderate' | 'critical'

export type ReminderSeverity = 'none' | 'gentle' | 'strong' | 'critical'

export interface BiomarkerSet {
  iron: number
  vitaminD: number
  vitaminB12: number
  magnesium: number
  bloodSugar: number
  cholesterol: number
}

export type BiomarkerKey = keyof BiomarkerSet

export interface BioSyncProfile {
  id: string
  name: string
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  createdAt: string
  updatedAt: string
}

export interface BloodReport {
  id: string
  source: BloodReportSource
  reportDate: string
  uploadedAt: string
  markers?: BiomarkerSet
  pdfFileName?: string
  pdfUrl?: string
}

export interface LifestyleProfile {
  diet: DietType
  allergies: string[]
  updatedAt: string
}

export interface WearableSnapshot {
  id: string
  date: string
  steps: number
  restingHeartRate: number
  hrv: number
  sleepHours: number
  workoutMinutes: number
  caloriesBurned?: number
  waterIntakeMl?: number
  syncedAt: string
}

export interface MoodLog {
  id: string
  date: string
  mood: MoodLevel
  note?: string
  createdAt: string
}

export interface BioRoutineSettings {
  enabled: boolean
  wakeTime?: string
  updatedAt: string
}

export interface LabBooking {
  id: string
  preferredDate: string
  labName?: string
  status: 'requested' | 'confirmed'
  createdAt: string
}

export interface BioSyncUserState {
  profile: BioSyncProfile
  bloodReports: BloodReport[]
  lifestyle?: LifestyleProfile
  wearables: WearableSnapshot[]
  moodLogs: MoodLog[]
  bioRoutineSettings: BioRoutineSettings
  labBookings: LabBooking[]
  createdAt: string
  updatedAt: string
}

export interface MarkerAnalysis {
  label: string
  value: number
  unit: string
  status: MarkerStatus
  severity?: MarkerSeverity
  insight: string
}

export interface BloodReportAnalysis {
  reportId: string
  analyzedAt: string
  markers: Record<BiomarkerKey, MarkerAnalysis>
  flaggedFindings: Array<{
    marker: BiomarkerKey
    status: MarkerStatus
    severity: MarkerSeverity
    insight: string
  }>
  summary: string[]
}

export interface BloodFreshness {
  isFresh: boolean
  daysOld: number
  staleAfterDays: number
  staleOn: string
}

export interface StepBoundaryResult {
  ok: boolean
  requiredStep?: number
  reason?: string
}
