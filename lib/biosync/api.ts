import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'
import {
  enforceStepBoundary,
  getCurrentStepProgress,
} from '@/lib/biosync/engine'
import { getBioSyncUserState } from '@/lib/biosync/store'
import type { BioSyncUserState } from '@/lib/biosync/types'

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function fail(error: string, status = 400, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...extra,
    },
    { status }
  )
}

export function parseZodError(error: ZodError): Record<string, string[]> {
  const fieldErrors = error.flatten().fieldErrors
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [field, messages ?? []])
  )
}

export async function getStateOrFail(
  userId: string
): Promise<
  { state: BioSyncUserState; response: null } | { state: null; response: NextResponse }
> {
  const state = await getBioSyncUserState(userId)
  if (!state) {
    return {
      state: null,
      response: fail('BioSync user not found. Complete Step 1 registration first.', 404),
    }
  }

  return {
    state,
    response: null,
  }
}

export function enforceStepOrFail(state: BioSyncUserState, step: number): NextResponse | null {
  const gate = enforceStepBoundary(state, step)
  if (!gate.ok) {
    return fail(gate.reason ?? 'Step boundary violation.', 409, {
      requiredStep: gate.requiredStep,
      currentStep: getCurrentStepProgress(state),
    })
  }

  return null
}

export function unknownError(error: unknown): NextResponse {
  return fail(
    error instanceof Error ? error.message : 'Unexpected server error.',
    500
  )
}
