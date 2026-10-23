import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, validatePassword, verifyPassword } from '../src/lib/passwords.js'

test('password policy rejects short and accepts long passwords', () => {
  assert.equal(validatePassword('short'), 'Password must be at least 12 characters long.')
  assert.equal(validatePassword('long-enough-password'), null)
})

test('password hashes cannot be used as passwords and verify correctly', async () => {
  const password = 'CorrectHorseBatteryStaple!42'
  const hash = await hashPassword(password)
  assert.notEqual(hash, password)
  assert.equal(await verifyPassword(password, hash), true)
  assert.equal(await verifyPassword('not-the-password', hash), false)
})
