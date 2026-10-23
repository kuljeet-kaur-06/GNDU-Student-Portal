import { prisma } from './prisma.js'

export const courseSelect = {
  id: true, code: true, name: true, semester: true, academicYear: true, isActive: true,
  department: { select: { id: true, name: true } },
}

export function dateOnly(value) {
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
  return date
}

export async function canTeach(userId, courseId) {
  return Boolean(await prisma.teacherAssignment.findFirst({ where: { teacherId: userId, courseId, isActive: true, teacher: { isActive: true }, course: { isActive: true } }, select: { id: true } }))
}

export async function canAccessCourse(user, courseId) {
  if (user.role === 'ADMIN') return true
  if (user.role === 'TEACHER') return canTeach(user.id, courseId)
  return Boolean(await prisma.enrollment.findFirst({ where: { studentId: user.id, courseId, isActive: true, course: { isActive: true } }, select: { id: true } }))
}

export function attendanceSummary(records) {
  const totalRecorded = records.length
  const present = records.filter(({ status }) => status === 'PRESENT' || status === 'LATE' || status === 'EXCUSED').length
  return { totalRecorded, present, absent: records.filter(({ status }) => status === 'ABSENT').length, percentage: totalRecorded ? Number(((present / totalRecorded) * 100).toFixed(1)) : null }
}

export function assessmentPercentage(marks) {
  const available = marks.reduce((sum, mark) => sum + mark.assessment.maximumMarks, 0)
  const earned = marks.reduce((sum, mark) => sum + mark.value, 0)
  return { earned, available, percentage: available ? Number(((earned / available) * 100).toFixed(1)) : null, grade: null, gradeNote: 'Official GNDU grade thresholds have not been configured.' }
}
