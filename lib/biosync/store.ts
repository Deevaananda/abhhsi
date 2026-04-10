import type {
  BioSyncProfile,
  BioSyncUserState,
  BloodReport,
  BioRoutineSettings,
  LabBooking,
  LifestyleProfile,
  MoodLog,
  WearableSnapshot,
} from '@/lib/biosync/types'
import { prisma } from '@/lib/db'
import {
  addLocalBloodReport,
  addLocalLabBooking,
  addLocalMoodLog,
  addLocalWearableSnapshot,
  createLocalBioSyncUser,
  getLocalBioSyncUserState,
  saveLocalBioSyncUserState,
  setLocalBioRoutineSettings,
  setLocalLifestyle,
  shouldUseLocalStore,
} from '@/lib/biosync/local-store'

function toDate(value: string): Date {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

type ProfileWithRelations = NonNullable<Awaited<ReturnType<typeof getProfileWithRelations>>>

function mapBloodReport(
  report: ProfileWithRelations['bloodReports'][number]
): BloodReport {
  return {
    id: report.id,
    source: report.source as BloodReport['source'],
    reportDate: report.reportDate.toISOString(),
    uploadedAt: report.uploadedAt.toISOString(),
    markers: report.biomarkers
      ? {
          iron: report.biomarkers.iron,
          vitaminD: report.biomarkers.vitaminD,
          vitaminB12: report.biomarkers.vitaminB12,
          magnesium: report.biomarkers.magnesium,
          bloodSugar: report.biomarkers.bloodSugar,
          cholesterol: report.biomarkers.cholesterol,
        }
      : undefined,
    pdfFileName: report.pdfFileName ?? undefined,
    pdfUrl: report.pdfUrl ?? undefined,
  }
}

function mapState(profile: ProfileWithRelations): BioSyncUserState {
  return {
    profile: {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      gender: profile.gender as BioSyncProfile['gender'],
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel as BioSyncProfile['activityLevel'],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    bloodReports: profile.bloodReports.map(mapBloodReport),
    lifestyle: profile.lifestyle
      ? {
          diet: profile.lifestyle.diet as NonNullable<BioSyncUserState['lifestyle']>['diet'],
          allergies: profile.lifestyle.allergies,
          updatedAt: profile.lifestyle.updatedAt.toISOString(),
        }
      : undefined,
    wearables: profile.wearables.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString(),
      steps: entry.steps,
      restingHeartRate: entry.restingHeartRate,
      hrv: entry.hrv,
      sleepHours: entry.sleepHours,
      workoutMinutes: entry.workoutMinutes,
      caloriesBurned: entry.caloriesBurned ?? undefined,
      waterIntakeMl: entry.waterIntakeMl ?? undefined,
      syncedAt: entry.syncedAt.toISOString(),
    })),
    moodLogs: profile.moodLogs.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString(),
      mood: entry.mood as MoodLog['mood'],
      note: entry.note ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    })),
    bioRoutineSettings: profile.routineSetting
      ? {
          enabled: profile.routineSetting.enabled,
          wakeTime: profile.routineSetting.wakeTime ?? undefined,
          updatedAt: profile.routineSetting.updatedAt.toISOString(),
        }
      : {
          enabled: false,
          updatedAt: profile.updatedAt.toISOString(),
        },
    labBookings: profile.labBookings.map((entry) => ({
      id: entry.id,
      preferredDate: entry.preferredDate.toISOString(),
      labName: entry.labName ?? undefined,
      status: entry.status as LabBooking['status'],
      createdAt: entry.createdAt.toISOString(),
    })),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}

async function getProfileWithRelations(userId: string) {
  return prisma.bioSyncProfile.findUnique({
    where: { id: userId },
    include: {
      bloodReports: {
        include: {
          biomarkers: true,
        },
        orderBy: {
          reportDate: 'desc',
        },
      },
      lifestyle: true,
      wearables: {
        orderBy: {
          date: 'desc',
        },
      },
      moodLogs: {
        orderBy: {
          date: 'desc',
        },
      },
      routineSetting: true,
      labBookings: {
        orderBy: {
          preferredDate: 'desc',
        },
      },
    },
  })
}

export async function createBioSyncUser(
  input: Omit<BioSyncProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BioSyncUserState> {
  if (shouldUseLocalStore()) {
    return createLocalBioSyncUser(input)
  }

  try {
    const created = await prisma.bioSyncProfile.create({
      data: {
        name: input.name,
        age: input.age,
        gender: input.gender,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        activityLevel: input.activityLevel,
        routineSetting: {
          create: {
            enabled: false,
          },
        },
      },
      include: {
        bloodReports: {
          include: {
            biomarkers: true,
          },
        },
        lifestyle: true,
        wearables: true,
        moodLogs: true,
        routineSetting: true,
        labBookings: true,
      },
    })

    return mapState(created)
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return createLocalBioSyncUser(input)
    }

    throw error
  }
}

export async function getBioSyncUserState(userId: string): Promise<BioSyncUserState | undefined> {
  if (shouldUseLocalStore()) {
    return getLocalBioSyncUserState(userId)
  }

  try {
    const profile = await getProfileWithRelations(userId)
    if (!profile) {
      return undefined
    }

    return mapState(profile)
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return getLocalBioSyncUserState(userId)
    }

    throw error
  }
}

export async function saveBioSyncUserState(state: BioSyncUserState): Promise<BioSyncUserState> {
  if (shouldUseLocalStore()) {
    return saveLocalBioSyncUserState(state)
  }

  try {
    await prisma.bioSyncProfile.update({
      where: {
        id: state.profile.id,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    const refreshed = await getBioSyncUserState(state.profile.id)
    return refreshed ?? state
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return saveLocalBioSyncUserState(state)
    }

    throw error
  }
}

export async function addBloodReport(
  state: BioSyncUserState,
  report: Omit<BloodReport, 'id' | 'uploadedAt'>
): Promise<BloodReport> {
  if (shouldUseLocalStore()) {
    return addLocalBloodReport(state, report)
  }

  try {
    const created = await prisma.bioSyncBloodReport.create({
      data: {
        userId: state.profile.id,
        source: report.source,
        reportDate: toDate(report.reportDate),
        pdfFileName: report.pdfFileName,
        pdfUrl: report.pdfUrl,
        biomarkers: report.markers
          ? {
              create: {
                iron: report.markers.iron,
                vitaminD: report.markers.vitaminD,
                vitaminB12: report.markers.vitaminB12,
                magnesium: report.markers.magnesium,
                bloodSugar: report.markers.bloodSugar,
                cholesterol: report.markers.cholesterol,
              },
            }
          : undefined,
      },
      include: {
        biomarkers: true,
      },
    })

    await saveBioSyncUserState(state)
    return mapBloodReport(created)
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return addLocalBloodReport(state, report)
    }

    throw error
  }
}

export async function setLifestyle(
  state: BioSyncUserState,
  lifestyle: Omit<LifestyleProfile, 'updatedAt'>
): Promise<LifestyleProfile> {
  if (shouldUseLocalStore()) {
    return setLocalLifestyle(state, lifestyle)
  }

  try {
    const updated = await prisma.bioSyncLifestyle.upsert({
      where: {
        userId: state.profile.id,
      },
      update: {
        diet: lifestyle.diet,
        allergies: lifestyle.allergies,
      },
      create: {
        userId: state.profile.id,
        diet: lifestyle.diet,
        allergies: lifestyle.allergies,
      },
    })

    await saveBioSyncUserState(state)
    return {
      diet: updated.diet as LifestyleProfile['diet'],
      allergies: updated.allergies,
      updatedAt: updated.updatedAt.toISOString(),
    }
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return setLocalLifestyle(state, lifestyle)
    }

    throw error
  }
}

export async function addWearableSnapshot(
  state: BioSyncUserState,
  snapshot: Omit<WearableSnapshot, 'id' | 'syncedAt'>
): Promise<WearableSnapshot> {
  if (shouldUseLocalStore()) {
    return addLocalWearableSnapshot(state, snapshot)
  }

  try {
    const created = await prisma.bioSyncWearableSnapshot.create({
      data: {
        userId: state.profile.id,
        date: toDate(snapshot.date),
        steps: snapshot.steps,
        restingHeartRate: snapshot.restingHeartRate,
        hrv: snapshot.hrv,
        sleepHours: snapshot.sleepHours,
        workoutMinutes: snapshot.workoutMinutes,
        caloriesBurned: snapshot.caloriesBurned,
        waterIntakeMl: snapshot.waterIntakeMl,
      },
    })

    await saveBioSyncUserState(state)
    return {
      id: created.id,
      date: created.date.toISOString(),
      steps: created.steps,
      restingHeartRate: created.restingHeartRate,
      hrv: created.hrv,
      sleepHours: created.sleepHours,
      workoutMinutes: created.workoutMinutes,
      caloriesBurned: created.caloriesBurned ?? undefined,
      waterIntakeMl: created.waterIntakeMl ?? undefined,
      syncedAt: created.syncedAt.toISOString(),
    }
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return addLocalWearableSnapshot(state, snapshot)
    }

    throw error
  }
}

export async function addMoodLog(
  state: BioSyncUserState,
  moodLog: Omit<MoodLog, 'id' | 'createdAt'>
): Promise<MoodLog> {
  if (shouldUseLocalStore()) {
    return addLocalMoodLog(state, moodLog)
  }

  try {
    const created = await prisma.bioSyncMoodLog.create({
      data: {
        userId: state.profile.id,
        date: toDate(moodLog.date),
        mood: moodLog.mood,
        note: moodLog.note,
      },
    })

    await saveBioSyncUserState(state)
    return {
      id: created.id,
      date: created.date.toISOString(),
      mood: created.mood as MoodLog['mood'],
      note: created.note ?? undefined,
      createdAt: created.createdAt.toISOString(),
    }
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return addLocalMoodLog(state, moodLog)
    }

    throw error
  }
}

export async function setBioRoutineSettings(
  state: BioSyncUserState,
  settings: Pick<BioRoutineSettings, 'enabled' | 'wakeTime'>
): Promise<BioRoutineSettings> {
  if (shouldUseLocalStore()) {
    return setLocalBioRoutineSettings(state, settings)
  }

  try {
    const updated = await prisma.bioSyncRoutineSettings.upsert({
      where: {
        userId: state.profile.id,
      },
      update: {
        enabled: settings.enabled,
        wakeTime: settings.wakeTime,
      },
      create: {
        userId: state.profile.id,
        enabled: settings.enabled,
        wakeTime: settings.wakeTime,
      },
    })

    await saveBioSyncUserState(state)
    return {
      enabled: updated.enabled,
      wakeTime: updated.wakeTime ?? undefined,
      updatedAt: updated.updatedAt.toISOString(),
    }
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return setLocalBioRoutineSettings(state, settings)
    }

    throw error
  }
}

export async function addLabBooking(
  state: BioSyncUserState,
  booking: Omit<LabBooking, 'id' | 'createdAt' | 'status'>
): Promise<LabBooking> {
  if (shouldUseLocalStore()) {
    return addLocalLabBooking(state, booking)
  }

  try {
    const created = await prisma.bioSyncLabBooking.create({
      data: {
        userId: state.profile.id,
        preferredDate: toDate(booking.preferredDate),
        labName: booking.labName,
        status: 'requested',
      },
    })

    await saveBioSyncUserState(state)
    return {
      id: created.id,
      preferredDate: created.preferredDate.toISOString(),
      labName: created.labName ?? undefined,
      status: created.status as LabBooking['status'],
      createdAt: created.createdAt.toISOString(),
    }
  } catch (error) {
    if (shouldUseLocalStore(error)) {
      return addLocalLabBooking(state, booking)
    }

    throw error
  }
}
