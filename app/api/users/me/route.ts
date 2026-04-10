import { ok, unknownError } from '@/lib/biosync/api'
import { getCurrentUser } from '@/lib/api-fallback-store'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return ok({ user: null })
    }

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    return unknownError(error)
  }
}
