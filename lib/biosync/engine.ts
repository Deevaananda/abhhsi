import type {
  BiomarkerKey,
  BioSyncUserState,
  BloodFreshness,
  BloodReport,
  BloodReportAnalysis,
  MarkerAnalysis,
  MarkerSeverity,
  MarkerStatus,
  MoodLevel,
  ReminderSeverity,
  StepBoundaryResult,
  WearableSnapshot,
} from '@/lib/biosync/types'

export const BLOOD_REPORT_VALIDITY_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

const markerRules: Record<
  BiomarkerKey,
  {
    label: string
    unit: string
    low?: number
    high?: number
  }
> = {
  iron: { label: 'Iron', unit: 'ug/dL', low: 60, high: 170 },
  vitaminD: { label: 'Vitamin D', unit: 'ng/mL', low: 30, high: 100 },
  vitaminB12: { label: 'Vitamin B12', unit: 'pg/mL', low: 200, high: 900 },
  magnesium: { label: 'Magnesium', unit: 'mg/dL', low: 1.7, high: 2.2 },
  bloodSugar: { label: 'Blood Sugar', unit: 'mg/dL', low: 70, high: 99 },
  cholesterol: { label: 'Cholesterol', unit: 'mg/dL', low: 125, high: 200 },
}

const moodToScore: Record<MoodLevel, number> = {
  happy: 100,
  calm: 85,
  neutral: 70,
  anxious: 55,
  stressed: 40,
  overwhelmed: 25,
}

const stepDependencies: Record<number, number[]> = {
  1: [],
  2: [1],
  3: [2],
  4: [2],
  5: [4],
  6: [5],
  7: [6],
  8: [7],
  9: [8],
  10: [5, 3],
  11: [6, 3],
  12: [10, 11, 7],
  13: [12],
  14: [2],
  15: [2],
  16: [15],
  17: [12, 13, 14, 16],
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return ((current - previous) / Math.abs(previous)) * 100
}

function round(value: number, places = 1): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

function isWithinLastDays(isoDate: string, days: number, now = new Date()): boolean {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  return now.getTime() - date.getTime() <= days * DAY_MS
}

function getRecentWearables(
  state: BioSyncUserState,
  days: number,
  now = new Date()
): WearableSnapshot[] {
  return state.wearables.filter((entry) => isWithinLastDays(entry.date, days, now))
}

function getSleepTargetHours(age: number): number {
  if (age <= 25) {
    return 8
  }

  if (age <= 64) {
    return 7.5
  }

  return 7
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  return hours * 60 + minutes
}

function minutesToTime(value: number): string {
  const normalized = ((value % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function markerStatus(key: BiomarkerKey, value: number): MarkerStatus {
  const rule = markerRules[key]

  if (rule.low !== undefined && value < rule.low) {
    return 'low'
  }

  if (rule.high !== undefined && value > rule.high) {
    return 'high'
  }

  return 'normal'
}

function markerSeverity(key: BiomarkerKey, value: number, status: MarkerStatus): MarkerSeverity {
  if (status === 'normal') {
    return 'mild'
  }

  const rule = markerRules[key]
  if (status === 'low' && rule.low !== undefined) {
    const deficitRatio = (rule.low - value) / rule.low
    if (deficitRatio >= 0.25) {
      return 'critical'
    }
    if (deficitRatio >= 0.1) {
      return 'moderate'
    }
  }

  if (status === 'high' && rule.high !== undefined) {
    const excessRatio = (value - rule.high) / rule.high
    if (excessRatio >= 0.25) {
      return 'critical'
    }
    if (excessRatio >= 0.1) {
      return 'moderate'
    }
  }

  return 'mild'
}

function markerInsight(key: BiomarkerKey, status: MarkerStatus): string {
  const insights: Record<BiomarkerKey, Record<MarkerStatus, string>> = {
    iron: {
      low: 'Iron is low. You may feel tired, weak, or short of breath during activity.',
      normal: 'Iron is in range, supporting oxygen transport and energy.',
      high: 'Iron is above range. Review supplementation and discuss with a clinician.',
    },
    vitaminD: {
      low: 'Vitamin D is low. This can affect immunity, mood, and bone strength.',
      normal: 'Vitamin D is in a healthy range.',
      high: 'Vitamin D is above range. Avoid high-dose supplementation until reviewed.',
    },
    vitaminB12: {
      low: 'Vitamin B12 is low. This can impact energy, focus, and nerve health.',
      normal: 'Vitamin B12 is in range for healthy nerve and blood function.',
      high: 'Vitamin B12 is above range. Recheck if supplements are being used.',
    },
    magnesium: {
      low: 'Magnesium is low. This can worsen cramps, sleep quality, and recovery.',
      normal: 'Magnesium is in range and supports muscle recovery and sleep.',
      high: 'Magnesium is above range. Review supplementation dosage.',
    },
    bloodSugar: {
      low: 'Blood sugar is low. You may have dips in energy and concentration.',
      normal: 'Blood sugar is in range for stable daily energy.',
      high: 'Blood sugar is elevated. Prioritize glycemic control and activity balance.',
    },
    cholesterol: {
      low: 'Cholesterol is low. Confirm with your clinician in context of symptoms.',
      normal: 'Cholesterol is in a healthy range.',
      high: 'Cholesterol is elevated. Nutrition and training load should be adjusted.',
    },
  }

  return insights[key][status]
}

function scoreHasAtLeast14Days(state: BioSyncUserState): boolean {
  const distinctDays = new Set(state.wearables.map((entry) => entry.date.slice(0, 10)))
  return distinctDays.size >= 14
}

function getLatestReport(state: BioSyncUserState): BloodReport | undefined {
  return [...state.bloodReports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )[0]
}

function getLatestAnalyzableReport(state: BioSyncUserState): BloodReport | undefined {
  return [...state.bloodReports]
    .filter((report) => report.markers)
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())[0]
}

function getAnalyzableReportsChronological(state: BioSyncUserState): BloodReport[] {
  return [...state.bloodReports]
    .filter((report) => report.markers)
    .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
}

export function calculateBloodFreshness(report: BloodReport, now = new Date()): BloodFreshness {
  const reportDate = new Date(report.reportDate)
  const ageMs = Math.max(0, now.getTime() - reportDate.getTime())
  const daysOld = Math.floor(ageMs / DAY_MS)
  const staleOnMs = reportDate.getTime() + BLOOD_REPORT_VALIDITY_DAYS * DAY_MS

  return {
    isFresh: daysOld <= BLOOD_REPORT_VALIDITY_DAYS,
    daysOld,
    staleAfterDays: BLOOD_REPORT_VALIDITY_DAYS,
    staleOn: new Date(staleOnMs).toISOString(),
  }
}

export function getBloodReminderStatus(daysOld: number): {
  level: ReminderSeverity
  message: string
} {
  if (daysOld >= 90) {
    return {
      level: 'critical',
      message: 'Blood report is stale. Upload a new report now or book a lab test.',
    }
  }

  if (daysOld >= 75) {
    return {
      level: 'strong',
      message: 'Blood report is nearing expiry. Schedule your next blood panel this week.',
    }
  }

  if (daysOld >= 60) {
    return {
      level: 'gentle',
      message: 'Blood report is 60+ days old. Plan your next blood test soon.',
    }
  }

  return {
    level: 'none',
    message: 'Blood report is fresh and valid.',
  }
}

export function analyzeBloodReport(report: BloodReport): BloodReportAnalysis {
  if (!report.markers) {
    throw new Error('Biomarkers are required for analysis.')
  }

  const markers = {} as Record<BiomarkerKey, MarkerAnalysis>
  const flaggedFindings: BloodReportAnalysis['flaggedFindings'] = []

  ;(Object.keys(report.markers) as BiomarkerKey[]).forEach((key) => {
    const value = report.markers![key]
    const status = markerStatus(key, value)
    const severity = markerSeverity(key, value, status)

    markers[key] = {
      label: markerRules[key].label,
      value,
      unit: markerRules[key].unit,
      status,
      severity,
      insight: markerInsight(key, status),
    }

    if (status !== 'normal') {
      flaggedFindings.push({
        marker: key,
        status,
        severity,
        insight: markerInsight(key, status),
      })
    }
  })

  const summary =
    flaggedFindings.length === 0
      ? ['No major blood marker mismatches found. Keep your routine consistent.']
      : flaggedFindings.map((finding) => `${markerRules[finding.marker].label}: ${finding.insight}`)

  return {
    reportId: report.id,
    analyzedAt: new Date().toISOString(),
    markers,
    flaggedFindings,
    summary,
  }
}

export function calculateHydrationTargetMl(state: BioSyncUserState): number {
  const baseMl = state.profile.weightKg * 35
  const activityBonus: Record<string, number> = {
    sedentary: 0,
    light: 250,
    moderate: 500,
    active: 750,
    athlete: 1000,
  }

  const ageAdjustment = state.profile.age < 30 ? 200 : state.profile.age > 50 ? -200 : 0
  const target = Math.max(1500, baseMl + activityBonus[state.profile.activityLevel] + ageAdjustment)

  return Math.round(target / 50) * 50
}

function estimateStressMismatch(state: BioSyncUserState): {
  mismatchDetected: boolean
  hrvAverage: number
  moodAverage: number
} {
  const recentHrv = average(getRecentWearables(state, 7).map((entry) => entry.hrv))
  const recentMood = average(
    state.moodLogs
      .filter((entry) => isWithinLastDays(entry.date, 7))
      .map((entry) => moodToScore[entry.mood])
  )

  const mismatchDetected = recentHrv > 0 && recentMood > 0 && recentHrv < 35 && recentMood > 80

  return {
    mismatchDetected,
    hrvAverage: round(recentHrv, 1),
    moodAverage: round(recentMood, 1),
  }
}

export function buildDynamicReminders(state: BioSyncUserState): {
  hydration: {
    targetMl: number
    reminderEveryMinutes: number
    message: string
  }
  sleep: {
    targetHours: number
    windDownAt: string
    message: string
  }
  stress: {
    breakEveryHours: number
    mismatchDetected: boolean
    message: string
  }
} {
  const hydrationTarget = calculateHydrationTargetMl(state)
  const sleepTarget = getSleepTargetHours(state.profile.age)
  const wakeTime = state.bioRoutineSettings.wakeTime ?? '06:30'
  const sleepTimeMinutes =
    (timeToMinutes(wakeTime) - Math.round(sleepTarget * 60) + 24 * 60) % (24 * 60)

  const recentHrv = average(getRecentWearables(state, 7).map((entry) => entry.hrv))
  const hydrationEveryMinutes =
    state.profile.activityLevel === 'active' || state.profile.activityLevel === 'athlete'
      ? 90
      : 120

  let breakEveryHours = 6
  if (recentHrv > 0 && recentHrv < 35) {
    breakEveryHours = 3
  } else if (recentHrv > 0 && recentHrv < 50) {
    breakEveryHours = 4
  }

  const mismatch = estimateStressMismatch(state)

  return {
    hydration: {
      targetMl: hydrationTarget,
      reminderEveryMinutes: hydrationEveryMinutes,
      message: `Target ${hydrationTarget} ml/day based on weight, age, and activity.`,
    },
    sleep: {
      targetHours: sleepTarget,
      windDownAt: minutesToTime(sleepTimeMinutes - 60),
      message: `Aim for ${sleepTarget}h sleep. Start wind-down 60 minutes before bedtime.`,
    },
    stress: {
      breakEveryHours,
      mismatchDetected: mismatch.mismatchDetected,
      message: mismatch.mismatchDetected
        ? 'Mood seems positive but HRV is low. Add extra stress recovery blocks today.'
        : 'Use regular breathing or stretch breaks to protect stress resilience.',
    },
  }
}

export function buildBioRoutine(state: BioSyncUserState): {
  enabled: boolean
  wakeTime?: string
  sleepTime?: string
  mealTimes?: {
    breakfast: string
    lunch: string
    dinner: string
  }
  movementSnacks?: string[]
  note: string
} {
  if (!state.bioRoutineSettings.enabled) {
    return {
      enabled: false,
      note: 'Bio-Routine is optional. Enable it to generate a daily timing blueprint.',
    }
  }

  const wakeTime = state.bioRoutineSettings.wakeTime ?? '06:30'
  const wakeMinutes = timeToMinutes(wakeTime)
  const sleepTarget = getSleepTargetHours(state.profile.age)
  const sleepMinutes = (wakeMinutes - Math.round(sleepTarget * 60) + 1440) % 1440

  const breakfast = wakeMinutes + 60
  const lunch = wakeMinutes + 6 * 60
  const dinner = wakeMinutes + 11 * 60

  const movementSnacks: string[] = []
  for (let slot = wakeMinutes + 3 * 60; slot <= dinner - 60; slot += 2 * 60) {
    movementSnacks.push(minutesToTime(slot))
  }

  return {
    enabled: true,
    wakeTime,
    sleepTime: minutesToTime(sleepMinutes),
    mealTimes: {
      breakfast: minutesToTime(breakfast),
      lunch: minutesToTime(lunch),
      dinner: minutesToTime(dinner),
    },
    movementSnacks,
    note: 'This routine is adaptive and should be recalculated when blood markers or wearables change.',
  }
}

function applyAllergyFilter(foods: string[], allergies: string[]): string[] {
  const allergyKeywords: Record<string, string[]> = {
    nuts: ['almond', 'walnut', 'cashew', 'peanut', 'nuts'],
    gluten: ['wheat', 'barley', 'rye', 'bread', 'pasta'],
    dairy: ['milk', 'cheese', 'yogurt', 'paneer', 'curd'],
    egg: ['egg'],
    soy: ['soy', 'tofu', 'edamame'],
    shellfish: ['shrimp', 'prawn', 'crab', 'shellfish'],
  }

  const blockedKeywords = allergies
    .map((allergy) => allergy.trim().toLowerCase())
    .flatMap((allergy) => allergyKeywords[allergy] ?? [allergy])

  return foods.filter((food) => {
    const normalized = food.toLowerCase()
    return !blockedKeywords.some((keyword) => normalized.includes(keyword))
  })
}

export function buildNutritionPlan(state: BioSyncUserState): {
  strategy: string
  findings: Array<{
    marker: BiomarkerKey
    status: MarkerStatus
    foods: string[]
  }>
  guardrails: string[]
} {
  const report = getLatestAnalyzableReport(state)
  if (!report?.markers || !state.lifestyle) {
    throw new Error('Lifestyle profile and analyzable blood report are required for nutrition.')
  }

  const analysis = analyzeBloodReport(report)

  const dietFoods: Record<string, Record<BiomarkerKey, string[]>> = {
    veg: {
      iron: ['Spinach + lemon', 'Lentils', 'Pumpkin seeds'],
      vitaminD: ['Fortified milk', 'UV-exposed mushrooms'],
      vitaminB12: ['Fortified cereals', 'Fortified nutritional yeast'],
      magnesium: ['Pumpkin seeds', 'Dark leafy greens', 'Black beans'],
      bloodSugar: ['Steel-cut oats', 'Chickpeas', 'High-fiber salads'],
      cholesterol: ['Oats', 'Flaxseed', 'Walnuts'],
    },
    vegan: {
      iron: ['Lentils', 'Tofu', 'Chickpeas'],
      vitaminD: ['Fortified soy milk', 'UV-exposed mushrooms'],
      vitaminB12: ['Fortified nutritional yeast', 'Fortified plant milk'],
      magnesium: ['Pumpkin seeds', 'Almonds', 'Quinoa'],
      bloodSugar: ['Lentil bowls', 'Chia seeds', 'Low GI grains'],
      cholesterol: ['Oats', 'Avocado', 'Ground flaxseed'],
    },
    eggetarian: {
      iron: ['Lentils', 'Spinach', 'Sesame seeds'],
      vitaminD: ['Egg yolk', 'Fortified milk'],
      vitaminB12: ['Eggs', 'Fortified yogurt'],
      magnesium: ['Dark chocolate (85%)', 'Beans', 'Pumpkin seeds'],
      bloodSugar: ['Egg + veggie breakfast', 'Brown rice', 'Mixed beans'],
      cholesterol: ['Oats', 'Beans', 'Olive oil'],
    },
    'non-veg': {
      iron: ['Lean red meat', 'Chicken liver', 'Spinach'],
      vitaminD: ['Fatty fish', 'Egg yolk'],
      vitaminB12: ['Fish', 'Eggs', 'Chicken'],
      magnesium: ['Salmon', 'Nuts and seeds', 'Black beans'],
      bloodSugar: ['Lean proteins', 'Vegetable-heavy plates', 'Low GI grains'],
      cholesterol: ['Fatty fish', 'Oats', 'Legumes'],
    },
  }

  const findings = analysis.flaggedFindings.map((finding) => {
    const baseFoods = dietFoods[state.lifestyle!.diet][finding.marker]
    return {
      marker: finding.marker,
      status: finding.status,
      foods: applyAllergyFilter(baseFoods, state.lifestyle!.allergies),
    }
  })

  const guardrails = [
    `Diet preference locked to ${state.lifestyle.diet}.`,
    state.lifestyle.allergies.length > 0
      ? `Allergy filter active: ${state.lifestyle.allergies.join(', ')}.`
      : 'No allergy exclusions configured.',
    'Update blood report every 90 days to keep nutrition logic accurate.',
  ]

  return {
    strategy: 'Food suggestions are anchored to blood deficiencies and constrained by diet + allergy boundaries.',
    findings,
    guardrails,
  }
}

export function buildThrottleDecision(state: BioSyncUserState): {
  mode: 'normal' | 'moderate-reduction' | 'high-reduction'
  intensityMultiplier: number
  reasons: string[]
} {
  const report = getLatestAnalyzableReport(state)
  if (!report?.markers) {
    throw new Error('Analyzable blood report required for AI throttling.')
  }

  const analysis = analyzeBloodReport(report)
  const recent = getRecentWearables(state, 7)
  const avgSleep = average(recent.map((entry) => entry.sleepHours))
  const avgHrv = average(recent.map((entry) => entry.hrv))
  const avgRhr = average(recent.map((entry) => entry.restingHeartRate))

  const reasons: string[] = []

  const criticalFindings = analysis.flaggedFindings.filter((finding) => finding.severity === 'critical')
  if (criticalFindings.length > 0) {
    reasons.push('Critical blood marker mismatch detected.')
  }

  if (avgSleep > 0 && avgSleep < 6.5) {
    reasons.push('Recovery debt: average sleep under 6.5 hours.')
  }

  if (avgHrv > 0 && avgHrv < 35) {
    reasons.push('Recovery strain: HRV trend is low.')
  }

  if (avgRhr > 0 && avgRhr > 82) {
    reasons.push('Elevated resting heart rate suggests incomplete recovery.')
  }

  if (reasons.length >= 2 || criticalFindings.length > 0) {
    return {
      mode: 'high-reduction',
      intensityMultiplier: 0.6,
      reasons,
    }
  }

  if (reasons.length === 1 || analysis.flaggedFindings.length > 0) {
    return {
      mode: 'moderate-reduction',
      intensityMultiplier: 0.8,
      reasons,
    }
  }

  return {
    mode: 'normal',
    intensityMultiplier: 1,
    reasons: ['No major mismatch detected across blood and recovery signals.'],
  }
}

function calculateMoodStability(moods: MoodLevel[]): number {
  if (moods.length === 0) {
    return 50
  }

  const values = moods.map((mood) => moodToScore[mood] / 20)
  const avg = average(values)
  const variance = average(values.map((value) => (value - avg) ** 2))
  const stdDevPenalty = Math.sqrt(variance) * 12

  return clamp(avg * 20 - stdDevPenalty)
}

export function calculateLongevityScore(state: BioSyncUserState): {
  score: number
  pillars: {
    fuel: number
    recovery: number
    resilience: number
    output: number
  }
  rationale: string[]
} {
  const latestReport = getLatestAnalyzableReport(state)
  if (!latestReport?.markers) {
    throw new Error('Analyzable blood report required for longevity scoring.')
  }

  const analysis = analyzeBloodReport(latestReport)
  const freshness = calculateBloodFreshness(latestReport)
  const recentWearables = getRecentWearables(state, 7)

  const avgSleep = average(recentWearables.map((entry) => entry.sleepHours))
  const avgHrv = average(recentWearables.map((entry) => entry.hrv))
  const avgSteps = average(recentWearables.map((entry) => entry.steps))
  const workoutConsistency =
    recentWearables.length === 0
      ? 0
      : (recentWearables.filter((entry) => entry.workoutMinutes >= 20).length /
          recentWearables.length) *
        100

  const deficiencyPenalty = analysis.flaggedFindings.reduce((penalty, finding) => {
    if (finding.severity === 'critical') {
      return penalty + 15
    }
    if (finding.severity === 'moderate') {
      return penalty + 10
    }
    return penalty + 6
  }, 0)

  const fuelBase = state.lifestyle ? 95 : 70
  const fuel = clamp(fuelBase - deficiencyPenalty - (freshness.isFresh ? 0 : 12))

  const sleepTarget = getSleepTargetHours(state.profile.age)
  const sleepScore = avgSleep === 0 ? 45 : clamp((avgSleep / sleepTarget) * 100)
  const hrvScore = avgHrv === 0 ? 50 : clamp(((avgHrv - 20) / 40) * 100)
  const freshnessScore = freshness.isFresh ? 100 : clamp(100 - (freshness.daysOld - 90) * 1.8, 35)
  const recovery = clamp(average([sleepScore, hrvScore, freshnessScore]))

  const recentMoods = state.moodLogs
    .filter((entry) => isWithinLastDays(entry.date, 14))
    .map((entry) => entry.mood)
  const resilience = calculateMoodStability(recentMoods)

  const output = clamp(average([clamp((avgSteps / 9000) * 100), workoutConsistency]))

  const score = round(average([fuel, recovery, resilience, output]), 1)

  return {
    score,
    pillars: {
      fuel: round(fuel, 1),
      recovery: round(recovery, 1),
      resilience: round(resilience, 1),
      output: round(output, 1),
    },
    rationale: [
      'Fuel is derived from blood deficiencies + diet profile readiness.',
      'Recovery is derived from sleep, HRV, and blood report freshness.',
      'Resilience is derived from mood stability and stress consistency.',
      'Output is derived from step volume and workout consistency.',
    ],
  }
}

export function buildWeeklyHealthDelta(state: BioSyncUserState, now = new Date()): {
  period: {
    currentWeekStart: string
    previousWeekStart: string
  }
  metrics: {
    biometrics: Record<string, { current: number; previous: number; deltaPercent: number }>
    activity: Record<string, { current: number; previous: number; deltaPercent: number }>
    habits: Record<string, { current: number; previous: number; deltaPercent: number }>
  }
  summary: string[]
} {
  const nowMs = now.getTime()
  const currentStart = new Date(nowMs - 6 * DAY_MS)
  const previousStart = new Date(nowMs - 13 * DAY_MS)
  const previousEnd = new Date(nowMs - 7 * DAY_MS)

  const currentWearables = state.wearables.filter(
    (entry) => new Date(entry.date).getTime() >= currentStart.getTime()
  )
  const previousWearables = state.wearables.filter((entry) => {
    const ts = new Date(entry.date).getTime()
    return ts >= previousStart.getTime() && ts <= previousEnd.getTime()
  })

  const currentMoods = state.moodLogs
    .filter((entry) => new Date(entry.date).getTime() >= currentStart.getTime())
    .map((entry) => entry.mood)
  const previousMoods = state.moodLogs
    .filter((entry) => {
      const ts = new Date(entry.date).getTime()
      return ts >= previousStart.getTime() && ts <= previousEnd.getTime()
    })
    .map((entry) => entry.mood)

  const hydrationTarget = calculateHydrationTargetMl(state)

  const hydrationAccuracy = (entries: WearableSnapshot[]): number => {
    const hydrated = entries.filter((entry) => typeof entry.waterIntakeMl === 'number')
    if (hydrated.length === 0) {
      return 0
    }

    return average(
      hydrated.map((entry) => clamp(((entry.waterIntakeMl ?? 0) / hydrationTarget) * 100))
    )
  }

  const workoutConsistency = (entries: WearableSnapshot[]): number => {
    if (entries.length === 0) {
      return 0
    }

    return (entries.filter((entry) => entry.workoutMinutes >= 20).length / entries.length) * 100
  }

  const current = {
    avgHrv: average(currentWearables.map((entry) => entry.hrv)),
    restingHeartRate: average(currentWearables.map((entry) => entry.restingHeartRate)),
    totalSteps: currentWearables.reduce((sum, entry) => sum + entry.steps, 0),
    caloriesBurned: currentWearables.reduce((sum, entry) => sum + (entry.caloriesBurned ?? 0), 0),
    workoutConsistency: workoutConsistency(currentWearables),
    hydrationAccuracy: hydrationAccuracy(currentWearables),
    sleepDuration: average(currentWearables.map((entry) => entry.sleepHours)),
    moodStability: calculateMoodStability(currentMoods),
  }

  const previous = {
    avgHrv: average(previousWearables.map((entry) => entry.hrv)),
    restingHeartRate: average(previousWearables.map((entry) => entry.restingHeartRate)),
    totalSteps: previousWearables.reduce((sum, entry) => sum + entry.steps, 0),
    caloriesBurned: previousWearables.reduce((sum, entry) => sum + (entry.caloriesBurned ?? 0), 0),
    workoutConsistency: workoutConsistency(previousWearables),
    hydrationAccuracy: hydrationAccuracy(previousWearables),
    sleepDuration: average(previousWearables.map((entry) => entry.sleepHours)),
    moodStability: calculateMoodStability(previousMoods),
  }

  const metrics = {
    biometrics: {
      avgHrv: {
        current: round(current.avgHrv, 1),
        previous: round(previous.avgHrv, 1),
        deltaPercent: round(percentChange(current.avgHrv, previous.avgHrv), 1),
      },
      restingHeartRate: {
        current: round(current.restingHeartRate, 1),
        previous: round(previous.restingHeartRate, 1),
        deltaPercent: round(percentChange(current.restingHeartRate, previous.restingHeartRate), 1),
      },
    },
    activity: {
      totalSteps: {
        current: round(current.totalSteps, 0),
        previous: round(previous.totalSteps, 0),
        deltaPercent: round(percentChange(current.totalSteps, previous.totalSteps), 1),
      },
      caloriesBurned: {
        current: round(current.caloriesBurned, 0),
        previous: round(previous.caloriesBurned, 0),
        deltaPercent: round(percentChange(current.caloriesBurned, previous.caloriesBurned), 1),
      },
      workoutConsistency: {
        current: round(current.workoutConsistency, 1),
        previous: round(previous.workoutConsistency, 1),
        deltaPercent: round(percentChange(current.workoutConsistency, previous.workoutConsistency), 1),
      },
    },
    habits: {
      hydrationAccuracy: {
        current: round(current.hydrationAccuracy, 1),
        previous: round(previous.hydrationAccuracy, 1),
        deltaPercent: round(percentChange(current.hydrationAccuracy, previous.hydrationAccuracy), 1),
      },
      sleepDuration: {
        current: round(current.sleepDuration, 1),
        previous: round(previous.sleepDuration, 1),
        deltaPercent: round(percentChange(current.sleepDuration, previous.sleepDuration), 1),
      },
      moodStability: {
        current: round(current.moodStability, 1),
        previous: round(previous.moodStability, 1),
        deltaPercent: round(percentChange(current.moodStability, previous.moodStability), 1),
      },
    },
  }

  const summary = [
    `Sleep duration changed by ${metrics.habits.sleepDuration.deltaPercent}% this week.`,
    `Hydration accuracy changed by ${metrics.habits.hydrationAccuracy.deltaPercent}% this week.`,
    `Workout consistency changed by ${metrics.activity.workoutConsistency.deltaPercent}% this week.`,
  ]

  return {
    period: {
      currentWeekStart: currentStart.toISOString(),
      previousWeekStart: previousStart.toISOString(),
    },
    metrics,
    summary,
  }
}

export function buildBiomarkerTrend(state: BioSyncUserState): {
  latestReportId: string
  previousReportId: string
  deltas: Array<{
    marker: BiomarkerKey
    previous: number
    current: number
    deltaPercent: number
    interpretation: 'improved' | 'worsened' | 'stable'
  }>
  summary: string[]
} {
  const reports = getAnalyzableReportsChronological(state)
  if (reports.length < 2) {
    throw new Error('At least two analyzable blood reports are required for long-term tracking.')
  }

  const previous = reports[reports.length - 2]
  const latest = reports[reports.length - 1]

  const deltas = (Object.keys(latest.markers ?? {}) as BiomarkerKey[]).map((marker) => {
    const previousValue = previous.markers![marker]
    const currentValue = latest.markers![marker]

    const previousStatus = markerStatus(marker, previousValue)
    const currentStatus = markerStatus(marker, currentValue)

    let interpretation: 'improved' | 'worsened' | 'stable' = 'stable'

    if (previousStatus !== 'normal' && currentStatus === 'normal') {
      interpretation = 'improved'
    } else if (previousStatus === 'normal' && currentStatus !== 'normal') {
      interpretation = 'worsened'
    } else {
      const direction = currentValue - previousValue
      if (marker === 'cholesterol' || marker === 'bloodSugar') {
        interpretation = direction < 0 ? 'improved' : direction > 0 ? 'worsened' : 'stable'
      } else {
        interpretation = direction > 0 ? 'improved' : direction < 0 ? 'worsened' : 'stable'
      }
    }

    return {
      marker,
      previous: round(previousValue, 2),
      current: round(currentValue, 2),
      deltaPercent: round(percentChange(currentValue, previousValue), 1),
      interpretation,
    }
  })

  const summary = deltas.map((delta) => {
    const markerName = markerRules[delta.marker].label
    return `${markerName} is ${delta.interpretation} (${delta.deltaPercent}% change).`
  })

  return {
    latestReportId: latest.id,
    previousReportId: previous.id,
    deltas,
    summary,
  }
}

export function buildLabPrompt(state: BioSyncUserState): {
  status: 'up-to-date' | 'gentle-reminder' | 'strong-reminder' | 'critical-alert'
  message: string
  cta: string
} {
  const report = getLatestReport(state)
  if (!report) {
    return {
      status: 'critical-alert',
      message: 'No blood report found. Upload a report to start BioSync personalization.',
      cta: 'Upload blood report',
    }
  }

  const freshness = calculateBloodFreshness(report)
  const reminder = getBloodReminderStatus(freshness.daysOld)

  if (reminder.level === 'none') {
    return {
      status: 'up-to-date',
      message: reminder.message,
      cta: 'No action needed',
    }
  }

  if (reminder.level === 'gentle') {
    return {
      status: 'gentle-reminder',
      message: reminder.message,
      cta: 'Plan next blood test',
    }
  }

  if (reminder.level === 'strong') {
    return {
      status: 'strong-reminder',
      message: reminder.message,
      cta: 'Book lab this week',
    }
  }

  return {
    status: 'critical-alert',
    message: reminder.message,
    cta: 'Book lab immediately',
  }
}

function isStepComplete(state: BioSyncUserState, step: number): boolean {
  const latestReport = getLatestReport(state)
  const analyzableReport = getLatestAnalyzableReport(state)

  switch (step) {
    case 1:
      return true
    case 2:
      return state.bloodReports.length > 0
    case 3:
      return Boolean(analyzableReport)
    case 4:
      return Boolean(latestReport)
    case 5:
      return Boolean(state.lifestyle)
    case 6:
      return state.wearables.length > 0
    case 7:
      return state.moodLogs.length > 0
    case 8:
      return state.wearables.length > 0 && state.moodLogs.length > 0
    case 9:
      return state.bioRoutineSettings.enabled
    case 10:
      return Boolean(state.lifestyle) && Boolean(analyzableReport)
    case 11:
      return Boolean(analyzableReport) && state.wearables.length > 0
    case 12:
      return (
        Boolean(state.lifestyle) &&
        Boolean(analyzableReport) &&
        state.wearables.length > 0 &&
        state.moodLogs.length > 0
      )
    case 13:
      return scoreHasAtLeast14Days(state)
    case 14:
      return getAnalyzableReportsChronological(state).length >= 2
    case 15:
      return Boolean(latestReport)
    case 16:
      return Boolean(latestReport)
    case 17:
      return isStepComplete(state, 12) && isStepComplete(state, 13) && isStepComplete(state, 14)
    default:
      return false
  }
}

export function getCurrentStepProgress(state: BioSyncUserState): number {
  let maxContiguousStep = 1

  for (let step = 2; step <= 17; step += 1) {
    if (!isStepComplete(state, step)) {
      break
    }

    maxContiguousStep = step
  }

  return maxContiguousStep
}

export function enforceStepBoundary(
  state: BioSyncUserState,
  requestedStep: number
): StepBoundaryResult {
  const prerequisites = stepDependencies[requestedStep] ?? []
  for (const step of prerequisites) {
    if (!isStepComplete(state, step)) {
      return {
        ok: false,
        requiredStep: step,
        reason: `Step ${requestedStep} is locked. Complete Step ${step} first.`,
      }
    }
  }

  return { ok: true }
}

export function buildCycleSummary(state: BioSyncUserState): {
  currentStep: number
  cycle: {
    bloodData: string
    routine: string
    activity: string
    weeklyInsights: string
    longevity: string
  }
  nextActions: string[]
} {
  const currentStep = getCurrentStepProgress(state)

  const bloodReport = getLatestReport(state)
  const bloodData = bloodReport
    ? calculateBloodFreshness(bloodReport).isFresh
      ? 'Fresh blood data available.'
      : 'Blood data is stale and must be refreshed.'
    : 'No blood data uploaded.'

  const routine = state.bioRoutineSettings.enabled
    ? 'Bio-Routine is active and can be refined continuously.'
    : 'Bio-Routine is disabled.'

  const activity = getRecentWearables(state, 7).length >= 5
    ? 'Wearables are syncing consistently.'
    : 'Wearable sync is low for the current week.'

  const weeklyInsights = scoreHasAtLeast14Days(state)
    ? 'Weekly trend engine has enough data.'
    : 'Need at least 14 days of wearable data for weekly deltas.'

  const longevity = isStepComplete(state, 12)
    ? `Longevity score is active.`
    : 'Longevity score is blocked until baseline pillars are complete.'

  const nextActions: string[] = []
  if (!isStepComplete(state, 2)) {
    nextActions.push('Upload blood report to unlock personalization.')
  }
  if (!isStepComplete(state, 5)) {
    nextActions.push('Complete lifestyle and allergy profiling.')
  }
  if (!isStepComplete(state, 6)) {
    nextActions.push('Sync wearable data for real-time adaptation.')
  }
  if (!isStepComplete(state, 7)) {
    nextActions.push('Submit daily mood logs for Human Gap detection.')
  }

  return {
    currentStep,
    cycle: {
      bloodData,
      routine,
      activity,
      weeklyInsights,
      longevity,
    },
    nextActions,
  }
}
