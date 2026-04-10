import {
  analyzeBloodReport,
  calculateBloodFreshness,
  enforceStepBoundary,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import {
  getStateOrFail,
  fail,
  ok,
  parseZodError,
  unknownError,
} from '@/lib/biosync/api'
import { bloodReportSchema } from '@/lib/biosync/schemas'
import { addBloodReport } from '@/lib/biosync/store'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const sortedReports = [...lookup.state.bloodReports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )

  return ok({
    reports: sortedReports,
    count: sortedReports.length,
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const lookup = await getStateOrFail(userId)
    if (lookup.response) {
      return lookup.response
    }

    const boundary = enforceStepBoundary(lookup.state, 2)
    if (!boundary.ok) {
      return fail(boundary.reason ?? 'Step boundary violation.', 409, {
        requiredStep: boundary.requiredStep,
        currentStep: getCurrentStepProgress(lookup.state),
      })
    }

    const body: unknown = await request.json()
    const parsed = bloodReportSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Validation failed for Step 2 blood report integration.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const report = await addBloodReport(lookup.state, parsed.data)
    const analysis = report.markers ? analyzeBloodReport(report) : null
    const freshness = calculateBloodFreshness(report)

    return ok(
      {
        report,
        analysis,
        freshness,
        currentStep: getCurrentStepProgress(lookup.state),
        nextStep: analysis ? 5 : 3,
        note: analysis
          ? 'Biological truth captured and analyzed.'
          : 'PDF captured. Add biomarkers to unlock Step 3 analysis.',
      },
      201
    )
  } catch (error) {
    return unknownError(error)
  }
}
