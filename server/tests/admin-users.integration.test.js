import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/passwords.js'

const prefix = `admin-user-${Date.now()}`
const password = 'CorrectHorseBatteryStaple!91'
const requestJson = (url, options = {}) => fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
const cookieFrom = (response) => response.headers.getSetCookie()[0].split(';')[0]

test('only administrators can create sanitized user accounts', async (context) => {
  const [admin, teacher] = await Promise.all([
    prisma.user.create({ data: { name: 'Account Admin', username: `${prefix}-admin`, passwordHash: await hashPassword(password), role: 'ADMIN', mustChangePassword: false } }),
    prisma.user.create({ data: { name: 'Account Teacher', username: `${prefix}-teacher`, passwordHash: await hashPassword(password), role: 'TEACHER', mustChangePassword: false } }),
  ])
  const server = createApp().listen(0); await new Promise((resolve) => server.once('listening', resolve)); const base = `http://127.0.0.1:${server.address().port}/api`
  context.after(async () => { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); await prisma.$disconnect() })
  const login = async (username) => cookieFrom(await requestJson(`${base}/auth/login`, { method: 'POST', body: JSON.stringify({ identifier: username, password }) }))
  const [adminCookie, teacherCookie] = await Promise.all([login(admin.username), login(teacher.username)])
  const payload = { name: 'Created Student', username: `${prefix}-student`, universityId: `${prefix}-id`, email: `${prefix}@example.com`, password, role: 'STUDENT' }
  const denied = await requestJson(`${base}/admin/users`, { method: 'POST', headers: { Cookie: teacherCookie }, body: JSON.stringify(payload) }); assert.equal(denied.status, 403)
  const created = await requestJson(`${base}/admin/users`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify(payload) }); assert.equal(created.status, 201); const body = await created.json(); assert.equal(body.user.passwordHash, undefined); assert.equal(body.user.role, 'student')
  const duplicate = await requestJson(`${base}/admin/users`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify(payload) }); assert.equal(duplicate.status, 409)
  const studentLogin = await requestJson(`${base}/auth/login`, { method: 'POST', body: JSON.stringify({ identifier: payload.username, password }) }); assert.equal(studentLogin.status, 200); const createdCookie = cookieFrom(studentLogin)
  assert.equal((await requestJson(`${base}/admin/session-check`, { headers: { Cookie: createdCookie } })).status, 403)
})
