import jwt from 'jsonwebtoken'
import { env, isProduction } from '../config/env.js'

export const sessionCookie = 'campusone_session'

export function signSession(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export function verifySession(token) {
  return jwt.verify(token, env.jwtSecret)
}

export function setSessionCookie(response, user) {
  response.cookie(sessionCookie, signSession(user), {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/api',
  })
}

export function clearSessionCookie(response) {
  response.clearCookie(sessionCookie, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/api' })
}
