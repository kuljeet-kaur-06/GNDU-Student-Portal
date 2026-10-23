import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { assessmentPercentage, attendanceSummary, canAccessCourse, canTeach, courseSelect, dateOnly } from '../lib/academic.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
const id = z.string().cuid()
const attendanceInput = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), records: z.array(z.object({ studentId: id, status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']) })).min(1).max(250) })
const assessmentInput = z.object({ courseId: id, title: z.string().trim().min(1).max(160), type: z.string().trim().max(60).nullable().optional(), maximumMarks: z.coerce.number().positive().max(10000), weight: z.coerce.number().positive().max(100).nullable().optional() })
const marksInput = z.object({ marks: z.array(z.object({ studentId: id, value: z.coerce.number().min(0).max(10000) })).min(1).max(250) })

router.use(authenticate)

router.get('/courses', async (request, response, next) => {
  try {
    let where = { isActive: true }
    if (request.user.role === 'STUDENT') where = { ...where, enrollments: { some: { studentId: request.user.id, isActive: true } } }
    if (request.user.role === 'TEACHER') where = { ...where, teacherAssignments: { some: { teacherId: request.user.id, isActive: true } } }
    response.json({ courses: await prisma.course.findMany({ where, select: courseSelect, orderBy: { code: 'asc' } }) })
  } catch (error) { next(error) }
})

router.get('/courses/:courseId/students', async (request, response, next) => {
  try {
    const courseId = id.parse(request.params.courseId)
    if (!await canAccessCourse(request.user, courseId)) return response.status(403).json({ error: 'You are not authorized for this course.' })
    if (request.user.role === 'STUDENT') return response.status(403).json({ error: 'Students cannot view class rosters.' })
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, isActive: true, student: { isActive: true } },
      orderBy: { student: { name: 'asc' } },
      include: { student: { select: { id: true, name: true, universityId: true, department: { select: { name: true } } } } },
    })
    response.json({ students: enrollments.map(({ student }) => student) })
  } catch (error) { next(error) }
})

router.put('/attendance/courses/:courseId', requireRole('TEACHER', 'ADMIN'), async (request, response, next) => {
  try {
    const courseId = id.parse(request.params.courseId); const payload = attendanceInput.parse(request.body); const date = dateOnly(payload.date)
    if (!date) return response.status(400).json({ error: 'Attendance date is invalid.' })
    if (request.user.role === 'TEACHER' && !await canTeach(request.user.id, courseId)) return response.status(403).json({ error: 'You are not assigned to this course.' })
    const studentIds = payload.records.map((record) => record.studentId)
    if (new Set(studentIds).size !== studentIds.length) return response.status(400).json({ error: 'Each student can appear only once.' })
    const enrolled = await prisma.enrollment.findMany({ where: { courseId, studentId: { in: studentIds }, isActive: true }, select: { studentId: true } })
    if (enrolled.length !== studentIds.length) return response.status(400).json({ error: 'Attendance can only be recorded for active course enrollments.' })
    const records = await prisma.$transaction(payload.records.map((record) => prisma.attendance.upsert({ where: { studentId_courseId_date: { studentId: record.studentId, courseId, date } }, create: { ...record, courseId, date, recordedById: request.user.id }, update: { status: record.status, recordedById: request.user.id } })))
    response.json({ records, updated: records.length })
  } catch (error) { next(error) }
})

router.get('/attendance/me', requireRole('STUDENT'), async (request, response, next) => {
  try {
    const courseId = request.query.courseId ? id.parse(request.query.courseId) : undefined
    const records = await prisma.attendance.findMany({ where: { studentId: request.user.id, ...(courseId && { courseId }) }, include: { course: { select: { id: true, code: true, name: true } } }, orderBy: { date: 'desc' } })
    const grouped = Object.groupBy(records, (record) => record.courseId)
    response.json({ records, summaries: Object.values(grouped).map((items) => ({ course: items[0].course, ...attendanceSummary(items) })) })
  } catch (error) { next(error) }
})

router.get('/attendance/courses/:courseId/summary', requireRole('TEACHER', 'ADMIN'), async (request, response, next) => {
  try {
    const courseId = id.parse(request.params.courseId)
    if (request.user.role === 'TEACHER' && !await canTeach(request.user.id, courseId)) return response.status(403).json({ error: 'You are not assigned to this course.' })
    const records = await prisma.attendance.findMany({ where: { courseId }, include: { student: { select: { id: true, name: true, universityId: true } } }, orderBy: [{ student: { name: 'asc' } }, { date: 'desc' }] })
    const grouped = Object.groupBy(records, (record) => record.studentId)
    response.json({ summaries: Object.values(grouped).map((items) => ({ student: items[0].student, ...attendanceSummary(items) })) })
  } catch (error) { next(error) }
})

router.get('/assessments', async (request, response, next) => {
  try {
    let where = {}
    if (request.user.role === 'STUDENT') where = { course: { enrollments: { some: { studentId: request.user.id, isActive: true } } } }
    if (request.user.role === 'TEACHER') where = { course: { teacherAssignments: { some: { teacherId: request.user.id, isActive: true } } } }
    const assessments = await prisma.assessment.findMany({ where, include: { course: { select: { id: true, code: true, name: true } }, marks: request.user.role === 'STUDENT' ? { where: { studentId: request.user.id }, select: { value: true } } : false }, orderBy: { createdAt: 'desc' } })
    response.json({ assessments: assessments.map((assessment) => ({ ...assessment, mark: request.user.role === 'STUDENT' ? assessment.marks[0]?.value ?? null : undefined, marks: undefined })) })
  } catch (error) { next(error) }
})

router.post('/assessments', requireRole('TEACHER', 'ADMIN'), async (request, response, next) => {
  try {
    const data = assessmentInput.parse(request.body)
    if (request.user.role === 'TEACHER' && !await canTeach(request.user.id, data.courseId)) return response.status(403).json({ error: 'You are not assigned to this course.' })
    const assessment = await prisma.assessment.create({ data: { ...data, createdById: request.user.id } }); response.status(201).json({ assessment })
  } catch (error) { next(error) }
})
router.patch('/assessments/:assessmentId', requireRole('TEACHER', 'ADMIN'), async (request, response, next) => {
  try {
    const assessmentId = id.parse(request.params.assessmentId); const existing = await prisma.assessment.findUnique({ where: { id: assessmentId } }); if (!existing) return response.status(404).json({ error: 'Assessment not found.' })
    if (request.user.role === 'TEACHER' && !await canTeach(request.user.id, existing.courseId)) return response.status(403).json({ error: 'You are not assigned to this course.' })
    const data = assessmentInput.omit({ courseId: true }).partial().parse(request.body); if (data.maximumMarks !== undefined && await prisma.mark.count({ where: { assessmentId, value: { gt: data.maximumMarks } } })) return response.status(400).json({ error: 'Maximum marks cannot be lower than an existing recorded mark.' })
    response.json({ assessment: await prisma.assessment.update({ where: { id: assessmentId }, data }) })
  } catch (error) { next(error) }
})
router.put('/assessments/:assessmentId/marks', requireRole('TEACHER', 'ADMIN'), async (request, response, next) => {
  try {
    const assessmentId = id.parse(request.params.assessmentId); const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } }); if (!assessment) return response.status(404).json({ error: 'Assessment not found.' })
    if (request.user.role === 'TEACHER' && !await canTeach(request.user.id, assessment.courseId)) return response.status(403).json({ error: 'You are not assigned to this course.' })
    const { marks } = marksInput.parse(request.body); const studentIds = marks.map(({ studentId }) => studentId)
    if (new Set(studentIds).size !== studentIds.length) return response.status(400).json({ error: 'Each student can have only one mark per assessment.' })
    if (marks.some(({ value }) => value > assessment.maximumMarks)) return response.status(400).json({ error: `Marks cannot exceed ${assessment.maximumMarks}.` })
    const enrolled = await prisma.enrollment.findMany({ where: { courseId: assessment.courseId, studentId: { in: studentIds }, isActive: true }, select: { studentId: true } }); if (enrolled.length !== studentIds.length) return response.status(400).json({ error: 'Marks can only be recorded for active course enrollments.' })
    const saved = await prisma.$transaction(marks.map((mark) => prisma.mark.upsert({ where: { assessmentId_studentId: { assessmentId, studentId: mark.studentId } }, create: { assessmentId, ...mark }, update: { value: mark.value } }))); response.json({ marks: saved })
  } catch (error) { next(error) }
})
router.get('/marks/me', requireRole('STUDENT'), async (request, response, next) => {
  try {
    const marks = await prisma.mark.findMany({
      where: { studentId: request.user.id },
      include: { assessment: { include: { course: { select: { id: true, code: true, name: true } } } } },
      orderBy: { assessment: { createdAt: 'desc' } },
    })
    response.json({ marks, summary: assessmentPercentage(marks) })
  } catch (error) { next(error) }
})

export default router
