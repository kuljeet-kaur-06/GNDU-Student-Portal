import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/passwords.js'

const prefix = `academic-phase-test-${Date.now()}`
const courseCode = `T${Date.now()}`
const password = 'CorrectHorseBatteryStaple!99'
const requestJson = (url, options = {}) => fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
const cookieFrom = (response) => response.headers.getSetCookie()[0].split(';')[0]

test('academic APIs enforce assignments and preserve missing-record semantics', async (context) => {
  const department = await prisma.department.create({ data: { name: `${prefix}-department` } })
  const [admin, teacher, otherTeacher, student] = await Promise.all([
    prisma.user.create({ data: { name: 'Academic Admin', username: `${prefix}-admin`, passwordHash: await hashPassword(password), role: 'ADMIN', mustChangePassword: false, departmentId: department.id } }),
    prisma.user.create({ data: { name: 'Assigned Teacher', username: `${prefix}-teacher`, passwordHash: await hashPassword(password), role: 'TEACHER', mustChangePassword: false, departmentId: department.id } }),
    prisma.user.create({ data: { name: 'Other Teacher', username: `${prefix}-other-teacher`, passwordHash: await hashPassword(password), role: 'TEACHER', mustChangePassword: false, departmentId: department.id } }),
    prisma.user.create({ data: { name: 'Academic Student', username: `${prefix}-student`, passwordHash: await hashPassword(password), role: 'STUDENT', mustChangePassword: false, departmentId: department.id } }),
  ])
  const server = createApp().listen(0); await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  context.after(async () => { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); await prisma.$disconnect() })
  const login = async (username) => cookieFrom(await requestJson(`${base}/auth/login`, { method: 'POST', body: JSON.stringify({ identifier: username, password }) }))
  const [adminCookie, teacherCookie, otherTeacherCookie, studentCookie] = await Promise.all([login(admin.username), login(teacher.username), login(otherTeacher.username), login(student.username)])

  const departmentCreate = await requestJson(`${base}/admin/departments`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ name: `${prefix}-second-department` }) }); assert.equal(departmentCreate.status, 201)
  const duplicateDepartment = await requestJson(`${base}/admin/departments`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ name: `${prefix}-second-department` }) }); assert.equal(duplicateDepartment.status, 409)
  const deniedAdmin = await requestJson(`${base}/admin/departments`, { headers: { Cookie: studentCookie } }); assert.equal(deniedAdmin.status, 403)

  const courseCreate = await requestJson(`${base}/admin/courses`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ code: courseCode, name: 'Synthetic Academic Course', departmentId: department.id }) }); assert.equal(courseCreate.status, 201); const { course } = await courseCreate.json()
  assert.equal((await requestJson(`${base}/admin/courses/${course.id}/teachers`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ teacherId: teacher.id }) })).status, 201)
  assert.equal((await requestJson(`${base}/admin/courses/${course.id}/enrollments`, { method: 'POST', headers: { Cookie: adminCookie }, body: JSON.stringify({ studentId: student.id }) })).status, 201)

  const deniedAttendance = await requestJson(`${base}/attendance/courses/${course.id}`, { method: 'PUT', headers: { Cookie: otherTeacherCookie }, body: JSON.stringify({ date: '2026-10-23', records: [{ studentId: student.id, status: 'PRESENT' }] }) }); assert.equal(deniedAttendance.status, 403)
  const studentEdit = await requestJson(`${base}/attendance/courses/${course.id}`, { method: 'PUT', headers: { Cookie: studentCookie }, body: JSON.stringify({ date: '2026-10-23', records: [{ studentId: student.id, status: 'PRESENT' }] }) }); assert.equal(studentEdit.status, 403)
  const attendance = await requestJson(`${base}/attendance/courses/${course.id}`, { method: 'PUT', headers: { Cookie: teacherCookie }, body: JSON.stringify({ date: '2026-10-23', records: [{ studentId: student.id, status: 'PRESENT' }] }) }); assert.equal(attendance.status, 200)
  const attendanceMine = await requestJson(`${base}/attendance/me`, { headers: { Cookie: studentCookie } }); const attendanceBody = await attendanceMine.json(); assert.equal(attendanceMine.status, 200); assert.equal(attendanceBody.summaries[0].percentage, 100)

  const assessmentCreate = await requestJson(`${base}/assessments`, { method: 'POST', headers: { Cookie: teacherCookie }, body: JSON.stringify({ courseId: course.id, title: 'Synthetic Quiz', maximumMarks: 10 }) }); assert.equal(assessmentCreate.status, 201); const { assessment } = await assessmentCreate.json()
  const invalidMarks = await requestJson(`${base}/assessments/${assessment.id}/marks`, { method: 'PUT', headers: { Cookie: teacherCookie }, body: JSON.stringify({ marks: [{ studentId: student.id, value: 11 }] }) }); assert.equal(invalidMarks.status, 400)
  const marks = await requestJson(`${base}/assessments/${assessment.id}/marks`, { method: 'PUT', headers: { Cookie: teacherCookie }, body: JSON.stringify({ marks: [{ studentId: student.id, value: 8 }] }) }); assert.equal(marks.status, 200)
  const myMarks = await requestJson(`${base}/marks/me`, { headers: { Cookie: studentCookie } }); const marksBody = await myMarks.json(); assert.equal(myMarks.status, 200); assert.equal(marksBody.marks[0].value, 8); assert.equal(marksBody.summary.percentage, 80)
})
