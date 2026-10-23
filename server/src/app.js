import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { env, isProduction } from './config/env.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import academicRoutes from './routes/academic.js'
import { errorHandler, notFound } from './middleware/error-handler.js'

export function createApp() {
  const app = express()
  if (isProduction) app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use((_, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  app.use(cors({ origin: env.frontendOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH'] }))
  app.use(express.json({ limit: '16kb' }))
  app.use(cookieParser())
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
  app.use('/api/auth', authRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api', academicRoutes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}
