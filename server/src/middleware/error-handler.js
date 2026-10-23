export function notFound(request, response) {
  response.status(404).json({ error: `Route not found: ${request.method} ${request.path}` })
}

export function errorHandler(error, _request, response, _next) {
  if (error?.name === 'ZodError') return response.status(400).json({ error: 'Invalid request data.', details: error.issues })
  if (error?.code === 'P2002') return response.status(409).json({ error: 'A record with those unique details already exists.' })
  if (error?.code === 'P2003') return response.status(400).json({ error: 'The related record is unavailable.' })
  if (error?.code === 'P2025') return response.status(404).json({ error: 'Record not found.' })
  console.error(error)
  return response.status(500).json({ error: 'An unexpected server error occurred.' })
}
