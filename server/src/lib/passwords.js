import bcrypt from 'bcryptjs'

const rounds = 12

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12) return 'Password must be at least 12 characters long.'
  if (password.length > 128) return 'Password must be at most 128 characters long.'
  return null
}

export async function hashPassword(password) {
  const error = validatePassword(password)
  if (error) throw new Error(error)
  return bcrypt.hash(password, rounds)
}

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash)
