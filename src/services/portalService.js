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
    list: (params = {}) => apiRequest(`/calendar/events${new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString() ? `?${new URLSearchParams(Object.entries(params).filter(([, value]) => value))}` : ''}`),
    create: (event) => apiRequest('/calendar/events', { method: 'POST', body: JSON.stringify(event) }),
    update: (id, event) => apiRequest(`/calendar/events/${id}`, { method: 'PATCH', body: JSON.stringify(event) }),
    remove: (id) => apiRequest(`/calendar/events/${id}`, { method: 'DELETE' }),
  },
  attendance: { finalize: (session) => apiRequest('/attendance/sessions', { method: 'POST', body: JSON.stringify(session) }) },
  announcements: {
    list: () => apiRequest('/announcements'),
    get: (id) => apiRequest(`/announcements/${id}`),
    create: (announcement) => apiRequest('/announcements', { method: 'POST', body: JSON.stringify(announcement) }),
    update: (id, announcement) => apiRequest(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(announcement) }),
    archive: (id) => apiRequest(`/announcements/${id}`, { method: 'DELETE' }),
  },
  messages: {
    list: () => apiRequest('/messages/conversations'),
    start: (participantId) => apiRequest('/messages/conversations', { method: 'POST', body: JSON.stringify({ participantId }) }),
    history: (conversationId, params = {}) => apiRequest(`/messages/conversations/${conversationId}/messages${new URLSearchParams(params).toString() ? `?${new URLSearchParams(params)}` : ''}`),
    send: (conversationId, content) => apiRequest(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    markRead: (conversationId) => apiRequest(`/messages/conversations/${conversationId}/read`, { method: 'POST' }),
  },
  users: {
    create: (role, user) => apiRequest(`/admin/users/${role}`, { method: 'POST', body: JSON.stringify(user) }),
    deactivate: (id) => apiRequest(`/admin/users/${encodeURIComponent(id)}/deactivate`, { method: 'POST' }),
  },
  fees: {
    list: (params = {}) => apiRequest(`/fees${new URLSearchParams(params).toString() ? `?${new URLSearchParams(params)}` : ''}`),
    get: (id) => apiRequest(`/fees/${id}`),
    create: (fee) => apiRequest('/fees', { method: 'POST', body: JSON.stringify(fee) }),
    update: (id, fee) => apiRequest(`/fees/${id}`, { method: 'PATCH', body: JSON.stringify(fee) }),
    recordPayment: (feeId, payment) => apiRequest(`/fees/${feeId}/payments`, { method: 'POST', body: JSON.stringify(payment) }),
    reversePayment: (paymentId, reason) => apiRequest(`/payments/${paymentId}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) }),
    receiptUrl: (paymentId) => `${import.meta.env.VITE_API_BASE_URL}/payments/${paymentId}/receipt`,
  },
  payments: { list: () => apiRequest('/payments/me') },
}
