export const demoNotice = 'Demo mode: academic entries below are illustrative and are not official GNDU records.'

export const demoUsers = {
  student: { id: 'demo-student', name: 'Aarav Sharma', role: 'student', programme: 'B.Tech Computer Science', department: 'Computer Science', semester: 'Semester 5', studentId: 'DEMO-2026-001', className: 'CSE-5A' },
  teacher: { id: 'demo-teacher', name: 'Dr. Meera Singh', role: 'teacher', department: 'Computer Science', assignedClasses: ['CSE-5A', 'CSE-5B'] },
  admin: { id: 'demo-admin', name: 'Campus Administrator', role: 'admin' },
}

export const subjects = [
  { code: 'DEMO-CS501', name: 'Data Structures & Algorithms', credits: 4 },
  { code: 'DEMO-CS502', name: 'Database Systems', credits: 4 },
  { code: 'DEMO-CS503', name: 'Computer Networks', credits: 3 },
  { code: 'DEMO-CS504', name: 'Software Engineering', credits: 3 },
  { code: 'DEMO-CS505', name: 'Programming Lab', credits: 2 },
]

export const timetable = [
  { day: 'Monday', time: '09:00 – 10:00', subject: 'Data Structures & Algorithms', room: 'Demo Lab 2', type: 'Lecture' },
  { day: 'Monday', time: '11:00 – 12:00', subject: 'Database Systems', room: 'Demo Block B-12', type: 'Lecture' },
  { day: 'Tuesday', time: '10:00 – 11:00', subject: 'Computer Networks', room: 'Demo Block B-08', type: 'Lecture' },
  { day: 'Wednesday', time: '09:00 – 11:00', subject: 'Programming Lab', room: 'Demo Lab 2', type: 'Lab' },
  { day: 'Thursday', time: '12:00 – 13:00', subject: 'Software Engineering', room: 'Demo Block B-10', type: 'Lecture' },
]

export const announcements = [
  { id: 1, category: 'Academic', title: 'Semester resource desk', body: 'Check the documents area for illustrative course resources.', date: 'Today', unread: true },
  { id: 2, category: 'Update', title: 'Timetable review period', body: 'Class schedule changes require university authorization before publication.', date: 'Yesterday', unread: false },
  { id: 3, category: 'Reminder', title: 'Keep your profile current', body: 'Contact information changes are subject to backend policy.', date: 'Oct 18', unread: false },
]

export const exams = [
  { subject: 'Database Systems', date: 'Demo date pending', time: 'To be published', venue: 'Awaiting official schedule' },
  { subject: 'Computer Networks', date: 'Demo date pending', time: 'To be published', venue: 'Awaiting official schedule' },
]

export const documents = [
  { title: 'Semester 5 syllabus (demo listing)', type: 'Syllabus', status: 'No verified file attached' },
  { title: 'Examination guidance (demo listing)', type: 'Guide', status: 'No verified file attached' },
  { title: 'Academic calendar (demo listing)', type: 'Calendar', status: 'No verified file attached' },
]

export const students = [
  { id: 'DEMO-2026-001', name: 'Aarav Sharma', className: 'CSE-5A', status: 'Active' },
  { id: 'DEMO-2026-002', name: 'Ishita Kapoor', className: 'CSE-5A', status: 'Active' },
  { id: 'DEMO-2026-003', name: 'Kabir Malhotra', className: 'CSE-5B', status: 'Active' },
]
