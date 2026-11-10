import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signupSchema, loginSchema } from '../utils/validation.util.js'

test('signupSchema accepts valid input', () => {
    const r = signupSchema.safeParse({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Passw0rd!'
    })
    assert.equal(r.success, true)
})

test('signupSchema rejects short password', () => {
    const r = signupSchema.safeParse({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'short'
    })
    assert.equal(r.success, false)
    assert.ok(r.error.issues.some(e => e.path.join('.') === 'password'))
})

test('signupSchema rejects bad email', () => {
    const r = signupSchema.safeParse({
        name: 'Test User',
        username: 'testuser',
        email: 'not-an-email',
        password: 'Passw0rd!'
    })
    assert.equal(r.success, false)
    assert.ok(r.error.issues.some(e => e.path.join('.') === 'email'))
})

test('loginSchema rejects empty identifier', () => {
    const r = loginSchema.safeParse({ identifier: '', password: 'x' })
    assert.equal(r.success, false)
})

test('loginSchema accepts valid input', () => {
    const r = loginSchema.safeParse({ identifier: 'user@example.com', password: 'secret' })
    assert.equal(r.success, true)
    assert.equal(r.data.identifier, 'user@example.com')
})