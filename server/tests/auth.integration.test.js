import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/passwords.js'

const testAdmin = { username: 'test-auth-admin', password: 'CorrectHorseBatteryStaple!42' }
const testTeacher = { username: 'test-auth-teacher', password: 'CorrectHorseBatteryStaple!43' }

function cookieFrom(response) {
  return response.headers.getSetCookie()[0].split(';')[0]
}

test('authentication verifies credentials, active status, and server-side roles', async (context) => {
  await prisma.user.deleteMany({ where: { username: { in: [testAdmin.username, testTeacher.username] } } })
  await prisma.user.createMany({ data: [
    { name: 'Test Admin', username: testAdmin.username, passwordHash: await hashPassword(testAdmin.password), role: 'ADMIN', mustChangePassword: false },
    { name: 'Test Teacher', username: testTeacher.username, passwordHash: await hashPassword(testTeacher.password), role: 'TEACHER', mustChangePassword: false },
  ] })
  const server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`
  context.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.user.deleteMany({ where: { username: { in: [testAdmin.username, testTeacher.username] } } })
    await prisma.$disconnect()
  })

  const invalid = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: testAdmin.username, password: 'wrong-password' }) })
  assert.equal(invalid.status, 401)

  const login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: testAdmin.username, password: testAdmin.password }) })
  assert.equal(login.status, 200)
  const adminCookie = cookieFrom(login)
  const adminCheck = await fetch(`${baseUrl}/admin/session-check`, { headers: { Cookie: adminCookie } })
  assert.equal(adminCheck.status, 200)

  const teacherLogin = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: testTeacher.username, password: testTeacher.password }) })
  const teacherCheck = await fetch(`${baseUrl}/admin/session-check`, { headers: { Cookie: cookieFrom(teacherLogin) } })
  assert.equal(teacherCheck.status, 403)

  await prisma.user.update({ where: { username: testAdmin.username }, data: { isActive: false } })
  const inactiveCheck = await fetch(`${baseUrl}/auth/me`, { headers: { Cookie: adminCookie } })
  assert.equal(inactiveCheck.status, 401)
})
