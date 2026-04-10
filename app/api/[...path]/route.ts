import { NextResponse } from 'next/server'
import {
  createAppointment,
  createEmergencyAlert,
  createNotification,
  createRecord,
  deleteAppointment,
  getCurrentUser,
  getDoctorDashboard,
  getDoctorPatients,
  getPatientDashboard,
  getRecordById,
  listAppointments,
  listRecords,
  listUserNotifications,
  loginOrCreateUser,
  markNotificationRead,
  registerAppUser,
  updateAppointment,
} from '@/lib/api-fallback-store'

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

async function parseJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const [root, id, leaf] = path
  const { searchParams } = new URL(request.url)

  if (root === 'users' && id === 'me') {
    const user = await getCurrentUser()
    return ok({ user })
  }

  if (root === 'users' && id && leaf === 'notifications') {
    const notifications = await listUserNotifications(id)
    return ok({ notifications })
  }

  if (root === 'patients' && id && leaf === 'dashboard') {
    const dashboard = await getPatientDashboard(id)
    return ok(dashboard)
  }

  if (root === 'patients' && id && leaf === 'appointments') {
    const appointments = await listAppointments({ patientId: id })
    return ok({ appointments })
  }

  if (root === 'patients' && id && leaf === 'records') {
    const records = await listRecords(id)
    return ok({ records })
  }

  if (root === 'doctors' && id && leaf === 'dashboard') {
    const dashboard = await getDoctorDashboard(id)
    return ok(dashboard)
  }

  if (root === 'doctors' && id && leaf === 'patients') {
    const patients = await getDoctorPatients(id)
    return ok({ patients })
  }

  if (root === 'appointments' && !id) {
    const patientId = searchParams.get('patientId') ?? undefined
    const doctorId = searchParams.get('doctorId') ?? undefined
    const appointments = await listAppointments({ patientId, doctorId })
    return ok({ appointments })
  }

  if (root === 'records' && !id) {
    const patientId = searchParams.get('patientId') ?? undefined
    const records = await listRecords(patientId)
    return ok({ records })
  }

  if (root === 'records' && id) {
    const record = await getRecordById(id)
    if (!record) {
      return fail('Record not found.', 404)
    }
    return ok({ record })
  }

  return ok({
    route: path.join('/'),
    message: 'Fallback GET response.',
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const [root, leaf] = path
  const body = await parseJson(request)

  if (root === 'auth' && leaf === 'login') {
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return fail('Email and password are required.', 400)
    }

    const user = await loginOrCreateUser(email, password)
    return ok(
      {
        user,
        token: `dev-token-${user.id}`,
      },
      200
    )
  }

  if (root === 'auth' && leaf === 'register') {
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return fail('Email and password are required.', 400)
    }

    const user = await registerAppUser({
      name: typeof body.name === 'string' ? body.name : undefined,
      email,
      password,
    })

    return ok({ user }, 201)
  }

  if (root === 'appointments' && !leaf) {
    const appointment = await createAppointment(body)
    if (appointment.patientId) {
      await createNotification({
        userId: appointment.patientId,
        type: 'appointment',
        title: 'Appointment booked',
        message: `Appointment scheduled on ${appointment.date} at ${appointment.time}.`,
      })
    }

    return ok({ appointment }, 201)
  }

  if (root === 'records' && !leaf) {
    const record = await createRecord(body)
    return ok({ record }, 201)
  }

  if (root === 'emergency' && !leaf) {
    const alert = await createEmergencyAlert(body)
    return ok({ alert }, 201)
  }

  return ok({
    route: path.join('/'),
    body,
    message: 'Fallback POST response.',
  })
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const [root, id] = path
  const body = await parseJson(request)

  if (root === 'appointments' && id) {
    const appointment = await updateAppointment(id, body)
    if (!appointment) {
      return fail('Appointment not found.', 404)
    }
    return ok({ appointment })
  }

  if (root === 'notifications' && id) {
    const read = body.read === true
    const notification = await markNotificationRead(id, read)
    if (!notification) {
      return fail('Notification not found.', 404)
    }
    return ok({ notification })
  }

  return ok({
    route: path.join('/'),
    body,
    message: 'Fallback PUT response.',
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const [root, id] = path

  if (root === 'appointments' && id) {
    const removed = await deleteAppointment(id)
    if (!removed) {
      return fail('Appointment not found.', 404)
    }
    return ok({ deleted: true })
  }

  return ok({
    route: path.join('/'),
    message: 'Fallback DELETE response.',
  })
}
