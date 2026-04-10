import {
  calculateBloodFreshness,
  getBloodReminderStatus,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import { enforceStepOrFail, fail, getStateOrFail, ok } from '@/lib/biosync/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 4)
  if (boundaryResponse) {
    return boundaryResponse
  }

  const latestReport = [...lookup.state.bloodReports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )[0]

  if (!latestReport) {
    return fail('No blood report found for freshness check.', 404)
  }

  const freshness = calculateBloodFreshness(latestReport)
  const reminder = getBloodReminderStatus(freshness.daysOld)

  return ok({
    reportId: latestReport.id,
    freshness,
    reminder,
    currentStep: getCurrentStepProgress(lookup.state),
    nextStep: 5,
  })
}
