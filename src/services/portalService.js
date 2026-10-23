import { apiRequest } from './api'

export const portalApi = {
  courses: {
    list: () => apiRequest('/courses'),
    students: (courseId) => apiRequest(`/courses/${courseId}/students`),
  },
  academics: {
    attendanceMine: () => apiRequest('/attendance/me'),
    saveAttendance: (courseId, payload) => apiRequest(`/attendance/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    assessments: () => apiRequest('/assessments'),
    createAssessment: (assessment) => apiRequest('/assessments', { method: 'POST', body: JSON.stringify(assessment) }),
    saveMarks: (assessmentId, marks) => apiRequest(`/assessments/${assessmentId}/marks`, { method: 'PUT', body: JSON.stringify({ marks }) }),
    marksMine: () => apiRequest('/marks/me'),
  },
  admin: {
    users: () => apiRequest('/admin/users'),
    departments: () => apiRequest('/admin/departments'),
    createDepartment: (department) => apiRequest('/admin/departments', { method: 'POST', body: JSON.stringify(department) }),
    courses: () => apiRequest('/admin/courses'),
    createCourse: (course) => apiRequest('/admin/courses', { method: 'POST', body: JSON.stringify(course) }),
    updateUserStatus: (userId, isActive) => apiRequest(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  },
  events: {
    list: () => apiRequest('/calendar/events'),
    create: (event) => apiRequest('/calendar/events', { method: 'POST', body: JSON.stringify(event) }),
    update: (id, event) => apiRequest(`/calendar/events/${id}`, { method: 'PATCH', body: JSON.stringify(event) }),
    remove: (id) => apiRequest(`/calendar/events/${id}`, { method: 'DELETE' }),
  },
  attendance: { finalize: (session) => apiRequest('/attendance/sessions', { method: 'POST', body: JSON.stringify(session) }) },
  messages: { create: (message) => apiRequest('/messages', { method: 'POST', body: JSON.stringify(message) }) },
  users: {
    create: (role, user) => apiRequest(`/admin/users/${role}`, { method: 'POST', body: JSON.stringify(user) }),
    deactivate: (id) => apiRequest(`/admin/users/${encodeURIComponent(id)}/deactivate`, { method: 'POST' }),
  },
  payments: { list: () => apiRequest('/payments/me') },
}
