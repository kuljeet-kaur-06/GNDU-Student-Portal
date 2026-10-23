import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { hashPassword, validatePassword } from '../lib/passwords.js'
import { publicUser } from '../lib/users.js'
import { courseSelect } from '../lib/academic.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
const id = z.string().cuid()
const limit = z.coerce.number().int().min(1).max(100).default(50)
const text = z.string().trim().min(1).max(160).nullable().optional().transform((value) => value || null)
const departmentInput = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).nullable().optional(), isActive: z.boolean().optional() })
const userInput = z.object({ name: z.string().trim().min(2).max(120), username: z.string().trim().min(3).max(64), universityId: text, email: z.string().trim().email().max(254).nullable().optional(), password: z.string().min(12).max(128), role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']), departmentId: id.nullable().optional(), isActive: z.boolean().optional() })
const courseInput = z.object({ code: z.string().trim().min(2).max(30), name: z.string().trim().min(2).max(160), departmentId: id, semester: text, academicYear: text, isActive: z.boolean().optional() })

router.use(authenticate, requireRole('ADMIN'))
router.get('/session-check', (_request, response) => response.json({ authorized: true }))

router.get('/users', async (request, response, next) => {
  try {
    const query = z.object({ limit, role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(), departmentId: id.optional(), active: z.enum(['true', 'false']).optional() }).parse(request.query)
    const users = await prisma.user.findMany({ where: { ...(query.role && { role: query.role }), ...(query.departmentId && { departmentId: query.departmentId }), ...(query.active && { isActive: query.active === 'true' }) }, take: query.limit, orderBy: { name: 'asc' }, include: { department: { select: { id: true, name: true } } } })
    response.json({ users: users.map((user) => ({ ...publicUser(user), email: user.email, department: user.department })) })
  } catch (error) { next(error) }
})
router.get('/users/:userId', async (request, response, next) => { try { const user = await prisma.user.findUnique({ where: { id: id.parse(request.params.userId) }, include: { department: { select: { id: true, name: true } } } }); if (!user) return response.status(404).json({ error: 'User not found.' }); response.json({ user: { ...publicUser(user), email: user.email, department: user.department } }) } catch (error) { next(error) } })
router.post('/users', async (request, response, next) => {
  try {
    const data = userInput.parse(request.body); const { password, ...userData } = data; const policyError = validatePassword(password)
    if (policyError) return response.status(400).json({ error: policyError })
    if (data.departmentId && !await prisma.department.findFirst({ where: { id: data.departmentId, isActive: true }, select: { id: true } })) return response.status(400).json({ error: 'Department is unavailable.' })
    const user = await prisma.user.create({ data: { ...userData, username: data.username.toLowerCase(), email: data.email?.toLowerCase() || null, passwordHash: await hashPassword(password), mustChangePassword: true } })
    response.status(201).json({ user: publicUser(user) })
  } catch (error) { next(error) }
})
router.patch('/users/:userId', async (request, response, next) => {
  try {
    const userId = id.parse(request.params.userId); const data = userInput.omit({ password: true, role: true }).partial().parse(request.body)
    if (!Object.keys(data).length) return response.status(400).json({ error: 'No permitted fields were supplied.' })
    if (data.departmentId && !await prisma.department.findFirst({ where: { id: data.departmentId, isActive: true }, select: { id: true } })) return response.status(400).json({ error: 'Department is unavailable.' })
    const user = await prisma.user.update({ where: { id: userId }, data: { ...data, username: data.username?.toLowerCase(), email: data.email?.toLowerCase() } }); response.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})
router.patch('/users/:userId/status', async (request, response, next) => { try { const userId = id.parse(request.params.userId); const { isActive } = z.object({ isActive: z.boolean() }).parse(request.body); if (userId === request.user.id && !isActive) return response.status(400).json({ error: 'You cannot deactivate your own account.' }); const user = await prisma.user.update({ where: { id: userId }, data: { isActive } }); response.json({ user: publicUser(user) }) } catch (error) { next(error) } })

router.get('/departments', async (_request, response, next) => { try { response.json({ departments: await prisma.department.findMany({ orderBy: { name: 'asc' } }) }) } catch (error) { next(error) } })
router.post('/departments', async (request, response, next) => { try { response.status(201).json({ department: await prisma.department.create({ data: departmentInput.parse(request.body) }) }) } catch (error) { next(error) } })
router.patch('/departments/:departmentId', async (request, response, next) => { try { response.json({ department: await prisma.department.update({ where: { id: id.parse(request.params.departmentId) }, data: departmentInput.partial().parse(request.body) }) }) } catch (error) { next(error) } })

router.get('/courses', async (request, response, next) => { try { const query = z.object({ departmentId: id.optional(), active: z.enum(['true', 'false']).optional() }).parse(request.query); response.json({ courses: await prisma.course.findMany({ where: { ...(query.departmentId && { departmentId: query.departmentId }), ...(query.active && { isActive: query.active === 'true' }) }, select: courseSelect, orderBy: { code: 'asc' } }) }) } catch (error) { next(error) } })
router.post('/courses', async (request, response, next) => { try { const data = courseInput.parse(request.body); const course = await prisma.course.create({ data: { ...data, code: data.code.toUpperCase() }, select: courseSelect }); response.status(201).json({ course }) } catch (error) { next(error) } })
router.patch('/courses/:courseId', async (request, response, next) => { try { const data = courseInput.partial().parse(request.body); const course = await prisma.course.update({ where: { id: id.parse(request.params.courseId) }, data: { ...data, code: data.code?.toUpperCase() }, select: courseSelect }); response.json({ course }) } catch (error) { next(error) } })
router.get('/courses/:courseId/assignments', async (request, response, next) => { try { const courseId = id.parse(request.params.courseId); const [teachers, enrollments] = await Promise.all([prisma.teacherAssignment.findMany({ where: { courseId }, include: { teacher: { select: { id: true, name: true, universityId: true, isActive: true } } } }), prisma.enrollment.findMany({ where: { courseId }, include: { student: { select: { id: true, name: true, universityId: true, isActive: true } } } })]); response.json({ teachers, enrollments }) } catch (error) { next(error) } })
router.post('/courses/:courseId/teachers', async (request, response, next) => { try { const courseId = id.parse(request.params.courseId); const { teacherId } = z.object({ teacherId: id }).parse(request.body); if (!await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER', isActive: true }, select: { id: true } })) return response.status(400).json({ error: 'An active teacher account is required.' }); const assignment = await prisma.teacherAssignment.upsert({ where: { teacherId_courseId: { teacherId, courseId } }, create: { teacherId, courseId }, update: { isActive: true } }); response.status(201).json({ assignment }) } catch (error) { next(error) } })
router.post('/courses/:courseId/enrollments', async (request, response, next) => { try { const courseId = id.parse(request.params.courseId); const { studentId } = z.object({ studentId: id }).parse(request.body); if (!await prisma.user.findFirst({ where: { id: studentId, role: 'STUDENT', isActive: true }, select: { id: true } })) return response.status(400).json({ error: 'An active student account is required.' }); const enrollment = await prisma.enrollment.upsert({ where: { studentId_courseId: { studentId, courseId } }, create: { studentId, courseId }, update: { isActive: true } }); response.status(201).json({ enrollment }) } catch (error) { next(error) } })
router.patch('/courses/:courseId/enrollments/:studentId', async (request, response, next) => { try { const enrollment = await prisma.enrollment.update({ where: { studentId_courseId: { studentId: id.parse(request.params.studentId), courseId: id.parse(request.params.courseId) } }, data: { isActive: z.object({ isActive: z.boolean() }).parse(request.body).isActive } }); response.json({ enrollment }) } catch (error) { next(error) } })
router.patch('/courses/:courseId/teachers/:teacherId', async (request, response, next) => { try { const assignment = await prisma.teacherAssignment.update({ where: { teacherId_courseId: { teacherId: id.parse(request.params.teacherId), courseId: id.parse(request.params.courseId) } }, data: { isActive: z.object({ isActive: z.boolean() }).parse(request.body).isActive } }); response.json({ assignment }) } catch (error) { next(error) } })

export default router
