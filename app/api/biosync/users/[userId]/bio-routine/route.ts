import {
  buildBioRoutine,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import {
  enforceStepOrFail,
  fail,
  getStateOrFail,
  ok,
  parseZodError,
  unknownError,
} from '@/lib/biosync/api'
import { bioRoutineSettingsSchema } from '@/lib/biosync/schemas'
import { setBioRoutineSettings } from '@/lib/biosync/store'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 9)
  if (boundaryResponse) {
    return boundaryResponse
  }

  return ok({
    settings: lookup.state.bioRoutineSettings,
    routine: buildBioRoutine(lookup.state),
    currentStep: getCurrentStepProgress(lookup.state),
  })
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const lookup = await getStateOrFail(userId)
    if (lookup.response) {
      return lookup.response
    }

    const boundaryResponse = enforceStepOrFail(lookup.state, 9)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const body: unknown = await request.json()
    const parsed = bioRoutineSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Validation failed for Step 9 Bio-Routine settings.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const settings = await setBioRoutineSettings(lookup.state, parsed.data)

    return ok({
      settings,
      routine: buildBioRoutine(lookup.state),
      currentStep: getCurrentStepProgress(lookup.state),
      nextStep: 10,
    })
  } catch (error) {
    return unknownError(error)
  }
}
