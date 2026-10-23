import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
dotenv.config({ path: path.join(serverRoot, '.env') })

function required(name, minimumLength = 1) {
  const value = process.env[name]
  if (!value || value.length < minimumLength) throw new Error(`${name} must be set in server/.env.`)
  return value
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  databaseUrl: required('DATABASE_URL'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  jwtSecret: required('JWT_SECRET', 32),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
})

export const isProduction = env.nodeEnv === 'production'
