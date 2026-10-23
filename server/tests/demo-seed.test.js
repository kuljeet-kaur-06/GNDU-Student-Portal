import test from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../src/lib/prisma.js'
import { verifyPassword } from '../src/lib/passwords.js'
import { demoAccounts, demoPassword, seedDemoAccounts } from '../src/scripts/seed-demo-accounts.js'

test('demo-account seed is repeatable and stores only password hashes', async (context) => {
  context.after(async () => { await prisma.$disconnect() })
  await seedDemoAccounts(prisma)
  await seedDemoAccounts(prisma)
  const users = await prisma.user.findMany({ where: { username: { in: demoAccounts.map(({ username }) => username) } }, orderBy: { username: 'asc' } })
  assert.equal(users.length, 12)
  assert.equal(users.filter((user) => user.role === 'STUDENT').length, 10)
  assert.equal(users.filter((user) => user.role === 'TEACHER').length, 2)
  assert.equal(await verifyPassword(demoPassword, users[0].passwordHash), true)
  assert.notEqual(users[0].passwordHash, demoPassword)
})
