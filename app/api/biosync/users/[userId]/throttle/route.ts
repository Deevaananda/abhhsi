import {
  buildThrottleDecision,
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

    const boundaryResponse = enforceStepOrFail(lookup.state, 11)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const throttle = buildThrottleDecision(lookup.state)

    return ok({
      throttle,
      currentStep: getCurrentStepProgress(lookup.state),
      nextStep: 12,
    })
  } catch (error) {
    return unknownError(error)
  }
}
