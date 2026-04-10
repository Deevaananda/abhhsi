import {
  buildNutritionPlan,
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

    const boundaryResponse = enforceStepOrFail(lookup.state, 10)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const nutrition = buildNutritionPlan(lookup.state)

    return ok({
      nutrition,
      currentStep: getCurrentStepProgress(lookup.state),
      nextStep: 11,
    })
  } catch (error) {
    return unknownError(error)
  }
}
