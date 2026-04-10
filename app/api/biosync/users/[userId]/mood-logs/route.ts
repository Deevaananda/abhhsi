import { getCurrentStepProgress } from '@/lib/biosync/engine'
import {
  enforceStepOrFail,
  fail,
  getStateOrFail,
  ok,
  parseZodError,
  unknownError,
} from '@/lib/biosync/api'
import { moodSchema } from '@/lib/biosync/schemas'
import { addMoodLog } from '@/lib/biosync/store'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 7)
  if (boundaryResponse) {
    return boundaryResponse
  }

  const limitParam = new URL(request.url).searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Number(limitParam)) : 30

  const moodLogs = [...lookup.state.moodLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

  return ok({
    moodLogs,
    count: lookup.state.moodLogs.length,
    currentStep: getCurrentStepProgress(lookup.state),
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

    const boundaryResponse = enforceStepOrFail(lookup.state, 7)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const body: unknown = await request.json()
    const parsed = moodSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Validation failed for Step 7 Human Gap mood log.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const moodLog = await addMoodLog(lookup.state, parsed.data)

    return ok(
      {
        moodLog,
        currentStep: getCurrentStepProgress(lookup.state),
        nextStep: 8,
      },
      201
    )
  } catch (error) {
    return unknownError(error)
  }
}
