const attempts = new Map()
const limit = 5
const windowMs = 15 * 60 * 1000

export function loginRateLimit(request, response, next) {
  const now = Date.now()
  const key = request.ip
  const entry = attempts.get(key)
  if (entry && entry.resetAt > now && entry.count >= limit) return response.status(429).json({ error: 'Too many login attempts. Please try again later.' })
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 0, resetAt: now + windowMs })
  response.locals.loginAttemptKey = key
  return next()
}

export function recordFailedLogin(request) {
  const key = responseKey(request)
  const entry = attempts.get(key)
  if (entry) entry.count += 1
}

function responseKey(request) {
  return request.ip
}

export function clearLoginAttempts(request) {
  attempts.delete(request.ip)
}
