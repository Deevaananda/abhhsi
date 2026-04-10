import {
  buildDynamicReminders,
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

  const boundaryResponse = enforceStepOrFail(lookup.state, 8)
  if (boundaryResponse) {
    return boundaryResponse
  }

  const reminders = buildDynamicReminders(lookup.state)

  return ok({
    reminders,
    currentStep: getCurrentStepProgress(lookup.state),
    nextStep: 9,
  })
}
