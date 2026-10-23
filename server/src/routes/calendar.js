import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { canTeacherManageCourse, visibleAudienceWhere } from '../lib/audience.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const id = z.string().cuid()
const date = z.string().datetime({ offset: true }).transform((value) => new Date(value))
const nullableText = z.string().trim().max(2000).nullable().optional().transform((value) => value || null)
const eventInput = z.object({
  title: z.string().trim().min(1).max(160), description: nullableText, startsAt: date, endsAt: date,
  category: z.enum(['ACADEMIC', 'EXAMINATION', 'HOLIDAY', 'GENERAL', 'DEPARTMENT']),
  audience: z.enum(['INSTITUTION', 'DEPARTMENT', 'COURSE']).default('INSTITUTION'),
  departmentId: id.nullable().optional(), courseId: id.nullable().optional(), status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
})
const eventInclude = { department: { select: { id: true, name: true } }, course: { select: { id: true, code: true, name: true } }, createdBy: { select: { id: true, name: true } } }

async function validateScope(user, data) {
  if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) throw new z.ZodError([{ code: 'custom', path: ['endsAt'], message: 'End time must be after start time.' }])
  if (data.audience === 'INSTITUTION' && (data.departmentId || data.courseId)) throw new z.ZodError([{ code: 'custom', path: ['audience'], message: 'Institution events cannot carry a department or course scope.' }])
  if (data.audience === 'DEPARTMENT' && (!data.departmentId || data.courseId)) throw new z.ZodError([{ code: 'custom', path: ['audience'], message: 'A department event needs one department.' }])
  if (data.audience === 'COURSE' && (!data.courseId || data.departmentId)) throw new z.ZodError([{ code: 'custom', path: ['audience'], message: 'A course event needs one course.' }])
  if (data.departmentId && !await prisma.department.findUnique({ where: { id: data.departmentId }, select: { id: true } })) throw new z.ZodError([{ code: 'custom', path: ['departmentId'], message: 'Department is unavailable.' }])
  if (data.courseId && !await prisma.course.findUnique({ where: { id: data.courseId }, select: { id: true } })) throw new z.ZodError([{ code: 'custom', path: ['courseId'], message: 'Course is unavailable.' }])
  if (user.role === 'TEACHER' && (data.audience !== 'COURSE' || !await canTeacherManageCourse(user.id, data.courseId))) return false
  return true
}
async function canManage(user, event) {
  return user.role === 'ADMIN' || (user.role === 'TEACHER' && event.createdById === user.id && event.audience === 'COURSE' && await canTeacherManageCourse(user.id, event.courseId))
}

router.use(authenticate)
router.get('/events', async (request, response, next) => {
  try {
    const query = z.object({ from: date.optional(), to: date.optional(), category: z.enum(['ACADEMIC', 'EXAMINATION', 'HOLIDAY', 'GENERAL', 'DEPARTMENT']).optional() }).parse(request.query)
    if (query.from && query.to && query.from > query.to) return response.status(400).json({ error: 'The date range is invalid.' })
    const audience = await visibleAudienceWhere(request.user)
    const access = request.user.role === 'ADMIN' ? {} : { OR: [{ status: 'PUBLISHED', ...audience }, { createdById: request.user.id }] }
    const events = await prisma.calendarEvent.findMany({ where: { ...access, ...(query.category && { category: query.category }), ...(query.from || query.to ? { startsAt: { ...(query.from && { gte: query.from }), ...(query.to && { lte: query.to }) } } : {}) }, include: eventInclude, orderBy: { startsAt: 'asc' } })
    response.json({ events })
  } catch (error) { next(error) }
})
router.get('/events/:eventId', async (request, response, next) => {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: id.parse(request.params.eventId) }, include: eventInclude })
    if (!event) return response.status(404).json({ error: 'Event not found.' })
    const audience = await visibleAudienceWhere(request.user)
    const allowed = request.user.role === 'ADMIN' || await canManage(request.user, event) || (event.status === 'PUBLISHED' && await prisma.calendarEvent.count({ where: { id: event.id, ...audience } }))
    if (!allowed) return response.status(404).json({ error: 'Event not found.' })
    response.json({ event })
  } catch (error) { next(error) }
})
router.post('/events', async (request, response, next) => {
  try {
    if (!['ADMIN', 'TEACHER'].includes(request.user.role)) return response.status(403).json({ error: 'You do not have permission to create events.' })
    const data = eventInput.parse(request.body)
    if (!await validateScope(request.user, data)) return response.status(403).json({ error: 'Teachers can create events only for their assigned courses.' })
    const event = await prisma.calendarEvent.create({ data: { ...data, createdById: request.user.id }, include: eventInclude })
    response.status(201).json({ event })
  } catch (error) { next(error) }
})
router.patch('/events/:eventId', async (request, response, next) => {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: id.parse(request.params.eventId) } })
    if (!event) return response.status(404).json({ error: 'Event not found.' })
    if (!await canManage(request.user, event)) return response.status(403).json({ error: 'You do not have permission to edit this event.' })
    const data = eventInput.partial().parse(request.body); if (!Object.keys(data).length) return response.status(400).json({ error: 'No changes were supplied.' })
    const merged = { ...event, ...data }
    if (!await validateScope(request.user, merged)) return response.status(403).json({ error: 'Teachers can manage events only for their assigned courses.' })
    response.json({ event: await prisma.calendarEvent.update({ where: { id: event.id }, data, include: eventInclude }) })
  } catch (error) { next(error) }
})
router.delete('/events/:eventId', async (request, response, next) => {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: id.parse(request.params.eventId) } })
    if (!event) return response.status(404).json({ error: 'Event not found.' })
    if (!await canManage(request.user, event)) return response.status(403).json({ error: 'You do not have permission to archive this event.' })
    response.json({ event: await prisma.calendarEvent.update({ where: { id: event.id }, data: { status: 'ARCHIVED' }, include: eventInclude }) })
  } catch (error) { next(error) }
})
export default router
