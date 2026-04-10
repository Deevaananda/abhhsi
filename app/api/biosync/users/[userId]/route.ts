import { calculateBloodFreshness, getCurrentStepProgress } from '@/lib/biosync/engine'
import { getStateOrFail, ok } from '@/lib/biosync/api'

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const { state } = lookup
  const latestReport = [...state.bloodReports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )[0]

  return ok({
    profile: state.profile,
    lifestyle: state.lifestyle,
    bioRoutineSettings: state.bioRoutineSettings,
    records: {
      bloodReports: state.bloodReports.length,
      wearableEntries: state.wearables.length,
      moodLogs: state.moodLogs.length,
      labBookings: state.labBookings.length,
    },
    bloodFreshness: latestReport ? calculateBloodFreshness(latestReport) : null,
    currentStep: getCurrentStepProgress(state),
  })
}
