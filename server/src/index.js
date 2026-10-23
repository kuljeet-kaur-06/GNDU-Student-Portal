import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'

const app = createApp()
const server = app.listen(env.port, () => console.log(`GNDU Portal API listening at http://localhost:${env.port}/api`))

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
