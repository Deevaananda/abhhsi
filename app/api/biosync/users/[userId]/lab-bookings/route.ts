import { getCurrentStepProgress } from '@/lib/biosync/engine'
import {
  enforceStepOrFail,
  fail,
  getStateOrFail,
  ok,
  parseZodError,
  unknownError,
} from '@/lib/biosync/api'
import { labBookingSchema } from '@/lib/biosync/schemas'
import { addLabBooking } from '@/lib/biosync/store'

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

  return ok({
    bookings: [...lookup.state.labBookings].sort(
      (a, b) => new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime()
    ),
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

    const boundaryResponse = enforceStepOrFail(lookup.state, 16)
    if (boundaryResponse) {
      return boundaryResponse
    }

    const body: unknown = await request.json()
    const parsed = labBookingSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Validation failed for Step 16 lab booking.', 400, {
        issues: parseZodError(parsed.error),
      })
    }

    const booking = await addLabBooking(lookup.state, parsed.data)

    return ok(
      {
        booking,
        currentStep: getCurrentStepProgress(lookup.state),
      },
      201
    )
  } catch (error) {
    return unknownError(error)
  }
}
