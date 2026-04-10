import { getCurrentStepProgress } from '@/lib/biosync/engine'
import {
  enforceStepOrFail,
  fail,
  getStateOrFail,
  ok,
  parseZodError,
  unknownError,
} from '@/lib/biosync/api'
import { lifestyleSchema } from '@/lib/biosync/schemas'
import { setLifestyle } from '@/lib/biosync/store'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 5)
  if (boundaryResponse) {
    return boundaryResponse
  }

  return ok({
    lifestyle: lookup.state.lifestyle ?? null,
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

    const boundaryResponse = enforceStepOrFail(lookup.state, 5)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const body: unknown = await request.json()
    const parsed = lifestyleSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Validation failed for Step 5 lifestyle profile.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const lifestyle = await setLifestyle(lookup.state, parsed.data)

    return ok({
      lifestyle,
      currentStep: getCurrentStepProgress(lookup.state),
      nextStep: 6,
    })
  } catch (error) {
    return unknownError(error)
  }
}
