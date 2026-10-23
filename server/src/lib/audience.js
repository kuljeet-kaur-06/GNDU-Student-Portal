import { prisma } from './prisma.js'

export async function enrolledCourseIds(userId) {
  const rows = await prisma.enrollment.findMany({ where: { studentId: userId, isActive: true }, select: { courseId: true } })
  return rows.map(({ courseId }) => courseId)
}

export async function taughtCourseIds(userId) {
  const rows = await prisma.teacherAssignment.findMany({ where: { teacherId: userId, isActive: true }, select: { courseId: true } })
  return rows.map(({ courseId }) => courseId)
}

export async function visibleAudienceWhere(user) {
  if (user.role === 'ADMIN') return {}
  const courseIds = user.role === 'STUDENT' ? await enrolledCourseIds(user.id) : await taughtCourseIds(user.id)
  return {
    OR: [
      { audience: 'INSTITUTION' },
      ...(user.departmentId ? [{ audience: 'DEPARTMENT', departmentId: user.departmentId }] : []),
      ...(courseIds.length ? [{ audience: 'COURSE', courseId: { in: courseIds } }] : []),
    ],
  }
}

export async function canTeacherManageCourse(userId, courseId) {
  return Boolean(await prisma.teacherAssignment.findFirst({ where: { teacherId: userId, courseId, isActive: true }, select: { id: true } }))
}

export async function canDirectMessage(sender, recipient) {
  if (sender.id === recipient.id || !recipient.isActive) return false
  if (sender.role === 'ADMIN' || recipient.role === 'ADMIN') return true
  if (sender.role === 'TEACHER' && recipient.role === 'STUDENT') {
    return Boolean(await prisma.enrollment.findFirst({ where: { studentId: recipient.id, isActive: true, course: { teacherAssignments: { some: { teacherId: sender.id, isActive: true } } } }, select: { id: true } }))
  }
  if (sender.role === 'STUDENT' && recipient.role === 'TEACHER') {
    return Boolean(await prisma.enrollment.findFirst({ where: { studentId: sender.id, isActive: true, course: { teacherAssignments: { some: { teacherId: recipient.id, isActive: true } } } }, select: { id: true } }))
  }
  return false
}
