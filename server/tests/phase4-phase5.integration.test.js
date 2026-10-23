import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/passwords.js'

const prefix = `phase45-${Date.now()}`
const password = 'CorrectHorseBatteryStaple!77'
const json = (url, options = {}) => fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
const cookie = (response) => response.headers.getSetCookie()[0].split(';')[0]

test('phase 4/5 protects drafts, conversations, financial records and receipts', async (context) => {
  const department = await prisma.department.create({ data: { name: `${prefix}-department` } })
  const [admin, teacher, student, otherStudent] = await Promise.all([
    prisma.user.create({ data: { name: 'Finance Admin', username: `${prefix}-admin`, passwordHash: await hashPassword(password), role: 'ADMIN', mustChangePassword: false, departmentId: department.id } }),
    prisma.user.create({ data: { name: 'Course Teacher', username: `${prefix}-teacher`, passwordHash: await hashPassword(password), role: 'TEACHER', mustChangePassword: false, departmentId: department.id } }),
    prisma.user.create({ data: { name: 'Fee Student', username: `${prefix}-student`, passwordHash: await hashPassword(password), role: 'STUDENT', mustChangePassword: false, departmentId: department.id } }),
    prisma.user.create({ data: { name: 'Other Student', username: `${prefix}-other`, passwordHash: await hashPassword(password), role: 'STUDENT', mustChangePassword: false, departmentId: department.id } }),
  ])
  const server = createApp().listen(0); await new Promise((resolve) => server.once('listening', resolve)); const base = `http://127.0.0.1:${server.address().port}/api`
  context.after(async () => { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); await prisma.$disconnect() })
  const login = async (username) => cookie(await json(`${base}/auth/login`, { method: 'POST', body: JSON.stringify({ identifier: username, password }) }))
  const [adminCookie, teacherCookie, studentCookie, otherCookie] = await Promise.all([login(admin.username), login(teacher.username), login(student.username), login(otherStudent.username)])

  const start = new Date(Date.now() + 86400000).toISOString(); const end = new Date(Date.now() + 90000000).toISOString()
  const draftResponse = await json(`${base}/calendar/events`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ title: 'Draft event', startsAt: start, endsAt: end, category: 'GENERAL', audience: 'INSTITUTION', status: 'DRAFT' }) }); assert.equal(draftResponse.status, 201); const { event: draft } = await draftResponse.json()
  assert.equal((await json(`${base}/calendar/events/${draft.id}`, { headers: { Cookie: studentCookie } })).status, 404)
  assert.equal((await json(`${base}/calendar/events`, { method: 'POST', headers: { Cookie: teacherCookie }, body: JSON.stringify({ title: 'Forbidden', startsAt: start, endsAt: end, category: 'GENERAL', audience: 'INSTITUTION' }) })).status, 403)
  await json(`${base}/calendar/events/${draft.id}`, { method: 'PATCH', headers: { Cookie: adminCookie }, body: JSON.stringify({ status: 'PUBLISHED' }) })
  assert.equal((await json(`${base}/calendar/events/${draft.id}`, { headers: { Cookie: studentCookie } })).status, 200)

  const feeResponse = await json(`${base}/fees`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ studentId: student.id, category: 'Tuition', description: 'Synthetic fee', amountDueMinor: 10000, currency: 'INR' }) }); assert.equal(feeResponse.status, 201); const { fee } = await feeResponse.json()
  assert.equal((await json(`${base}/fees`, { method: 'POST', headers: { Cookie: teacherCookie }, body: JSON.stringify({ studentId: student.id, category: 'Tuition', description: 'Denied', amountDueMinor: 10000 }) })).status, 403)
  assert.equal((await json(`${base}/fees/${fee.id}/payments`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ amountMinor: 10001, method: 'CASH', transactionReference: `${prefix}-over` }) })).status, 400)
  const paid = await json(`${base}/fees/${fee.id}/payments`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ amountMinor: 4000, method: 'CASH', transactionReference: `${prefix}-paid` }) }); assert.equal(paid.status, 201); const { payment } = await paid.json()
  assert.equal((await json(`${base}/fees/${fee.id}/payments`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ amountMinor: 4000, method: 'CASH', transactionReference: `${prefix}-paid` }) })).status, 409)
  const mine = await json(`${base}/fees`, { headers: { Cookie: studentCookie } }); const mineBody = await mine.json(); assert.equal(mine.status, 200); assert.equal(mineBody.fees[0].outstandingMinor, 6000)
  assert.equal((await json(`${base}/fees?studentId=${otherStudent.id}`, { headers: { Cookie: studentCookie } })).status, 403)
  assert.equal((await json(`${base}/payments/${payment.id}/receipt`, { headers: { Cookie: otherCookie } })).status, 404)
  assert.equal((await json(`${base}/payments/${payment.id}/receipt`, { headers: { Cookie: studentCookie } })).status, 200)

  const started = await json(`${base}/messages/conversations`, { method: 'POST', headers: { Cookie: studentCookie }, body: JSON.stringify({ participantId: admin.id }) }); assert.equal(started.status, 201); const { conversation } = await started.json()
  assert.equal((await json(`${base}/messages/conversations/${conversation.id}/messages`, { method: 'POST', headers: { Cookie: studentCookie }, body: JSON.stringify({ content: 'Private test message' }) })).status, 201)
  assert.equal((await json(`${base}/messages/conversations/${conversation.id}/messages`, { headers: { Cookie: otherCookie } })).status, 404)
})
