import { Role } from '@prisma/client'
import '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { hashPassword } from '../lib/passwords.js'

const name = process.env.INITIAL_ADMIN_NAME?.trim()
const username = process.env.INITIAL_ADMIN_USERNAME?.trim()
const password = process.env.INITIAL_ADMIN_PASSWORD

if (!name || !username || !password) {
  console.error('Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_USERNAME, and INITIAL_ADMIN_PASSWORD in server/.env before running this command.')
  process.exitCode = 1
} else {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: Role.ADMIN } })
    if (existingAdmin) throw new Error('An administrator already exists. Use a future admin-management workflow instead of creating another bootstrap admin.')
    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) throw new Error('INITIAL_ADMIN_USERNAME is already in use.')
    const admin = await prisma.user.create({ data: { name, username, passwordHash: await hashPassword(password), role: Role.ADMIN, mustChangePassword: true } })
    console.log(`Initial administrator '${admin.username}' created. Sign in, then change the temporary password immediately.`)
  } catch (error) {
    console.error(`Admin bootstrap failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
