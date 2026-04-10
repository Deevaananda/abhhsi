import {
  buildLabPrompt,
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

  const boundaryResponse = enforceStepOrFail(lookup.state, 16)
  if (boundaryResponse) {
    return boundaryResponse
  }

  const prompt = buildLabPrompt(lookup.state)

  return ok({
    prompt,
    currentStep: getCurrentStepProgress(lookup.state),
    nextStep: 17,
  })
}
