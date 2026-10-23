import { fileURLToPath } from 'node:url'
import { prisma } from '../lib/prisma.js'
import { hashPassword } from '../lib/passwords.js'

// Development-only credentials. Never use these accounts or this password in production.
export const demoPassword = 'LocalTestPassword!2026'
export const demoDepartmentName = 'GNDU Test Department'
export const demoAccounts = [
  ['STUDENT', 'S123', 'S1', 'student01'], ['STUDENT', 'S124', 'S2', 'student02'],
  ['STUDENT', 'S125', 'S3', 'student03'], ['STUDENT', 'S126', 'S4', 'student04'],
  ['STUDENT', 'S127', 'S5', 'student05'], ['STUDENT', 'S128', 'S6', 'student06'],
  ['STUDENT', 'S129', 'S7', 'student07'], ['STUDENT', 'S130', 'S8', 'student08'],
  ['STUDENT', 'S131', 'S9', 'student09'], ['STUDENT', 'S132', 'S10', 'student10'],
  ['TEACHER', 'T001', 'T1', 'teacher01'], ['TEACHER', 'T002', 'T2', 'teacher02'],
].map(([role, universityId, name, username]) => ({ role, universityId, name, username, email: `${username}@example.com` }))

export async function seedDemoAccounts(client = prisma) {
  const passwordHash = await hashPassword(demoPassword)
  return client.$transaction(async (tx) => {
    let department = await tx.department.findUnique({ where: { name: demoDepartmentName } })
    if (!department) department = await tx.department.create({ data: { name: demoDepartmentName, description: 'Development-only test accounts.' } })
    let created = 0
    let existing = 0
    for (const account of demoAccounts) {
      const match = await tx.user.findFirst({ where: { OR: [{ username: account.username }, { universityId: account.universityId }, { email: account.email }] }, select: { id: true } })
      if (match) { existing += 1; continue }
      await tx.user.create({ data: { ...account, passwordHash, mustChangePassword: false, departmentId: department.id } })
      created += 1
    }
    return { created, existing, department: department.name }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await seedDemoAccounts()
    console.log(`Demo accounts complete: ${result.created} created, ${result.existing} already present in ${result.department}.`)
  } finally {
    await prisma.$disconnect()
  }
}
