import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { hashPassword, validatePassword, verifyPassword } from '../lib/passwords.js'
import { publicUser } from '../lib/users.js'
import { clearSessionCookie, setSessionCookie } from '../lib/tokens.js'
import { authenticate } from '../middleware/auth.js'
import { clearLoginAttempts, loginRateLimit, recordFailedLogin } from '../middleware/login-rate-limit.js'

const router = Router()
const credentialsSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
})
const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(1).max(128),
})

router.post('/login', loginRateLimit, async (request, response, next) => {
  try {
    const { identifier, password } = credentialsSchema.parse(request.body)
    const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { universityId: identifier }, { email: identifier.toLowerCase() }] } })
    const valid = user && user.isActive && await verifyPassword(password, user.passwordHash)
    if (!valid) {
      recordFailedLogin(request)
      return response.status(401).json({ error: 'Invalid username or password.' })
    }
    clearLoginAttempts(request)
    setSessionCookie(response, user)
    return response.json({ user: publicUser(user) })
  } catch (error) { return next(error) }
})

router.post('/logout', (_request, response) => {
  clearSessionCookie(response)
  response.status(204).end()
})

router.get('/me', authenticate, (request, response) => response.json({ user: publicUser(request.user) }))

router.post('/change-password', authenticate, async (request, response, next) => {
  try {
    const { currentPassword, newPassword } = passwordSchema.parse(request.body)
    const policyError = validatePassword(newPassword)
    if (policyError) return response.status(400).json({ error: policyError })
    if (!await verifyPassword(currentPassword, request.user.passwordHash)) return response.status(401).json({ error: 'Your current password is incorrect.' })
    if (currentPassword === newPassword) return response.status(400).json({ error: 'Choose a different new password.' })
    const user = await prisma.user.update({ where: { id: request.user.id }, data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false } })
    setSessionCookie(response, user)
    return response.json({ user: publicUser(user) })
  } catch (error) { return next(error) }
})

export default router
