import {
  analyzeBloodReport,
  calculateBloodFreshness,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import { enforceStepOrFail, fail, getStateOrFail, ok } from '@/lib/biosync/api'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 3)
  if (boundaryResponse) {
    return boundaryResponse
  }

  const reportId = new URL(request.url).searchParams.get('reportId')

  const candidateReports = lookup.state.bloodReports.filter((report) => report.markers)
  const report = reportId
    ? candidateReports.find((entry) => entry.id === reportId)
    : [...candidateReports].sort(
        (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      )[0]

  if (!report) {
    return fail('No analyzable blood report found for Step 3.', 404, {
      currentStep: getCurrentStepProgress(lookup.state),
    })
  }

  const analysis = analyzeBloodReport(report)
  const freshness = calculateBloodFreshness(report)

  return ok({
    reportId: report.id,
    reportDate: report.reportDate,
    analysis,
    freshness,
    currentStep: getCurrentStepProgress(lookup.state),
    nextStep: 4,
  })
}
