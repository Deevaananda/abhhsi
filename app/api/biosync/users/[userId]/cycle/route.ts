import {
  buildCycleSummary,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import { enforceStepOrFail, getStateOrFail, ok } from '@/lib/biosync/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 17)
  if (boundaryResponse) {
    return boundaryResponse
  }

  return ok({
    cycleSummary: buildCycleSummary(lookup.state),
    currentStep: getCurrentStepProgress(lookup.state),
  })
}
