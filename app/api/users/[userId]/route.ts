import { fail, ok, unknownError } from '@/lib/biosync/api'
import { getBioSyncUserState, saveBioSyncUserState } from '@/lib/biosync/store'
import {
  getStoredUserProfile,
  upsertStoredUserProfile,
  type SettingsGender,
} from '@/lib/user-profile-store'

function normalizeGender(value: unknown): SettingsGender {
  if (value === 'male' || value === 'female' || value === 'other') {
    return value
  }
  return ''
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

type UpdateProfilePayload = {
  fullName?: unknown
  email?: unknown
  phone?: unknown
  dateOfBirth?: unknown
  gender?: unknown
  bloodType?: unknown
  bio?: unknown
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const [bioSyncState, stored] = await Promise.all([
      getBioSyncUserState(userId),
      getStoredUserProfile(userId),
    ])

    if (!bioSyncState && !stored) {
      return fail('User not found.', 404)
    }

    const profile = {
      fullName: stored?.fullName || bioSyncState?.profile.name || '',
      email: stored?.email || '',
      phone: stored?.phone || '',
      dateOfBirth: stored?.dateOfBirth || '',
      gender: (stored?.gender || bioSyncState?.profile.gender || '') as SettingsGender,
      bloodType: stored?.bloodType || '',
      bio: stored?.bio || '',
    }

    return ok({
      userId,
      profile,
      updatedAt:
        stored?.updatedAt ||
        bioSyncState?.profile.updatedAt ||
        new Date().toISOString(),
    })
  } catch (error) {
    return unknownError(error)
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const payload = (await request.json()) as UpdateProfilePayload

    const updatedStored = await upsertStoredUserProfile(userId, {
      fullName: normalizeText(payload.fullName),
      email: normalizeText(payload.email),
      phone: normalizeText(payload.phone),
      dateOfBirth: normalizeText(payload.dateOfBirth),
      gender: normalizeGender(payload.gender),
      bloodType: normalizeText(payload.bloodType),
      bio: normalizeText(payload.bio),
    })

    const bioSyncState = await getBioSyncUserState(userId)
    if (bioSyncState) {
      const nextName = updatedStored.fullName || bioSyncState.profile.name
      const nextGender =
        updatedStored.gender === 'male' ||
        updatedStored.gender === 'female' ||
        updatedStored.gender === 'other'
          ? updatedStored.gender
          : bioSyncState.profile.gender

      if (
        nextName !== bioSyncState.profile.name ||
        nextGender !== bioSyncState.profile.gender
      ) {
        await saveBioSyncUserState({
          ...bioSyncState,
          profile: {
            ...bioSyncState.profile,
            name: nextName,
            gender: nextGender,
          },
        })
      }
    }

    return ok({
      userId,
      profile: {
        fullName: updatedStored.fullName,
        email: updatedStored.email,
        phone: updatedStored.phone,
        dateOfBirth: updatedStored.dateOfBirth,
        gender: updatedStored.gender,
        bloodType: updatedStored.bloodType,
        bio: updatedStored.bio,
      },
      updatedAt: updatedStored.updatedAt,
    })
  } catch (error) {
    return unknownError(error)
  }
}
