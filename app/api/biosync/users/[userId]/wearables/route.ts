import { getCurrentStepProgress } from '@/lib/biosync/engine'
import {
  enforceStepOrFail,
  fail,
  getStateOrFail,
  ok,
  parseZodError,
  unknownError,
} from '@/lib/biosync/api'
import { wearableSchema } from '@/lib/biosync/schemas'
import { addWearableSnapshot } from '@/lib/biosync/store'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const lookup = await getStateOrFail(userId)
  if (lookup.response) {
    return lookup.response
  }

  const boundaryResponse = enforceStepOrFail(lookup.state, 6)
  if (boundaryResponse) {
    return boundaryResponse
  }

  const limitParam = new URL(request.url).searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Number(limitParam)) : 30

  const wearables = [...lookup.state.wearables]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

  return ok({
    wearables,
    count: lookup.state.wearables.length,
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

    const boundaryResponse = enforceStepOrFail(lookup.state, 6)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const body: unknown = await request.json()
    const parsed = wearableSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Validation failed for Step 6 wearable integration.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const snapshot = await addWearableSnapshot(lookup.state, parsed.data)

    return ok(
      {
        snapshot,
        currentStep: getCurrentStepProgress(lookup.state),
        nextStep: 7,
      },
      201
    )
  } catch (error) {
    return unknownError(error)
  }
}
