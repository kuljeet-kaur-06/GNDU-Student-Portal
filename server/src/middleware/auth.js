import { prisma } from '../lib/prisma.js'
import { verifySession, sessionCookie } from '../lib/tokens.js'

export async function authenticate(request, response, next) {
  try {
    const token = request.cookies[sessionCookie]
    if (!token) return response.status(401).json({ error: 'Authentication is required.' })
    const payload = verifySession(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) return response.status(401).json({ error: 'Your account is unavailable.' })
    request.user = user
    return next()
  } catch {
    return response.status(401).json({ error: 'Your session is invalid or has expired.' })
  }
}

export const requireRole = (...roles) => (request, response, next) => {
  if (!roles.includes(request.user.role)) return response.status(403).json({ error: 'You do not have permission to perform this action.' })
  return next()
}
