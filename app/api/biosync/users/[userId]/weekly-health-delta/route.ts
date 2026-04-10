import {
  buildWeeklyHealthDelta,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import { enforceStepOrFail, getStateOrFail, ok, unknownError } from '@/lib/biosync/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const lookup = await getStateOrFail(userId)
    if (lookup.response) {
      return lookup.response
    }

    const boundaryResponse = enforceStepOrFail(lookup.state, 13)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const weeklyDelta = buildWeeklyHealthDelta(lookup.state)

    return ok({
      weeklyDelta,
      currentStep: getCurrentStepProgress(lookup.state),
      nextStep: 14,
    })
  } catch (error) {
    return unknownError(error)
  }
}
