export const academicSession = { start: new Date(2026, 7, 1), end: new Date(2027, 5, 30) }

export const calendarEvents = [
  { id: 'demo-class-1', type: 'class', title: 'Data Structures & Algorithms', className: 'CSE-5A', teacher: 'Dr. Meera Singh', room: 'Demo Lab 2', start: '2026-08-03T09:00', end: '2026-08-03T10:00' },
  { id: 'demo-class-2', type: 'class', title: 'Database Systems', className: 'CSE-5A', teacher: 'Dr. Meera Singh', room: 'Demo Block B-12', start: '2026-08-03T11:00', end: '2026-08-03T12:00' },
]

export function monthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = new Date(first); start.setDate(first.getDate() - first.getDay())
  const cells = []
  for (let i = 0; i < 42; i += 1) { const day = new Date(start); day.setDate(start.getDate() + i); cells.push(day) }
  return cells
}
export const sameDay = (a, b) => a.toDateString() === b.toDateString()
export const eventOnDay = (event, day) => sameDay(new Date(event.start), day)
export const formatDate = (value, options = { month: 'short', day: 'numeric' }) => new Intl.DateTimeFormat('en-IN', options).format(new Date(value))
export const timeRange = (event) => `${formatDate(event.start, { hour: 'numeric', minute: '2-digit' })}–${formatDate(event.end, { hour: 'numeric', minute: '2-digit' })}`
// Endpoints that touch are intentionally considered non-overlapping.
export function findScheduleConflict(candidate, events) {
  const start = new Date(candidate.start).getTime(); const end = new Date(candidate.end).getTime()
  return events.find((event) => event.id !== candidate.id && start < new Date(event.end).getTime() && end > new Date(event.start).getTime() && (event.room === candidate.room || event.teacherId === candidate.teacherId || event.teacher === candidate.teacher))
}
