import { getCurrentStepProgress } from '@/lib/biosync/engine'
import { fail, ok, parseZodError, unknownError } from '@/lib/biosync/api'
import { registrationSchema } from '@/lib/biosync/schemas'
import { createBioSyncUser } from '@/lib/biosync/store'

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = registrationSchema.safeParse(body)

    if (!parsed.success) {
      return fail('Validation failed for Step 1 registration.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const state = await createBioSyncUser(parsed.data)

    return ok(
      {
        userId: state.profile.id,
        profile: state.profile,
        currentStep: getCurrentStepProgress(state),
        nextStep: 2,
      },
      201
    )
  } catch (error) {
    return unknownError(error)
  }
}
