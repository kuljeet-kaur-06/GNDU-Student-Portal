import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { canDirectMessage } from '../lib/audience.js'
import { authenticate } from '../middleware/auth.js'

const router = Router(); const id = z.string().cuid(); const messageInput = z.object({ content: z.string().trim().min(1).max(4000) }); const limit = z.coerce.number().int().min(1).max(100).default(30)
const person = { select: { id: true, name: true, role: true, universityId: true } }
async function participant(conversationId, userId) { return prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } }) }

router.use(authenticate)
router.get('/conversations', async (request, response, next) => {
  try {
    const conversations = await prisma.conversation.findMany({ where: { participants: { some: { userId: request.user.id } } }, include: { participants: { include: { user: person } }, messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { sender: person } } }, orderBy: { updatedAt: 'desc' } })
    response.json({ conversations: conversations.map(({ participants, messages, ...conversation }) => ({ ...conversation, participants: participants.map(({ user, lastReadAt }) => ({ ...user, lastReadAt })), latestMessage: messages[0] || null })) })
  } catch (error) { next(error) }
})
router.post('/conversations', async (request, response, next) => {
  try {
    const { participantId } = z.object({ participantId: id }).parse(request.body)
    if (participantId === request.user.id) return response.status(400).json({ error: 'You cannot start a conversation with yourself.' })
    const recipient = await prisma.user.findUnique({ where: { id: participantId } }); if (!recipient || !await canDirectMessage(request.user, recipient)) return response.status(403).json({ error: 'This recipient is not available for private messaging.' })
    const directKey = [request.user.id, recipient.id].sort().join(':')
    const conversation = await prisma.conversation.upsert({ where: { directKey }, create: { directKey, participants: { create: [{ userId: request.user.id }, { userId: recipient.id }] } }, update: {}, include: { participants: { include: { user: person } } } })
    response.status(201).json({ conversation })
  } catch (error) { next(error) }
})
router.get('/conversations/:conversationId/messages', async (request, response, next) => {
  try {
    const conversationId = id.parse(request.params.conversationId); if (!await participant(conversationId, request.user.id)) return response.status(404).json({ error: 'Conversation not found.' })
    const query = z.object({ cursor: id.optional(), limit }).parse(request.query)
    const rows = await prisma.message.findMany({ where: { conversationId }, include: { sender: person }, orderBy: { createdAt: 'desc' }, take: query.limit + 1, ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }) })
    const hasMore = rows.length > query.limit; const messages = (hasMore ? rows.slice(0, -1) : rows).reverse(); response.json({ messages, nextCursor: hasMore ? messages[0].id : null })
  } catch (error) { next(error) }
})
router.post('/conversations/:conversationId/messages', async (request, response, next) => {
  try {
    const conversationId = id.parse(request.params.conversationId); if (!await participant(conversationId, request.user.id)) return response.status(404).json({ error: 'Conversation not found.' })
    const { content } = messageInput.parse(request.body)
    const message = await prisma.$transaction(async (tx) => { const saved = await tx.message.create({ data: { conversationId, senderId: request.user.id, content }, include: { sender: person } }); await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }); return saved })
    response.status(201).json({ message })
  } catch (error) { next(error) }
})
router.post('/conversations/:conversationId/read', async (request, response, next) => { try { const conversationId = id.parse(request.params.conversationId); const entry = await participant(conversationId, request.user.id); if (!entry) return response.status(404).json({ error: 'Conversation not found.' }); await prisma.conversationParticipant.update({ where: { id: entry.id }, data: { lastReadAt: new Date() } }); response.status(204).end() } catch (error) { next(error) } })
export default router
