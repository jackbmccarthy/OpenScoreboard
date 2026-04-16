import test from 'node:test'
import assert from 'node:assert/strict'

import {
  hasAccessSecretMetadata,
  sanitizeAccessControlledRecord,
  sanitizeClientDatabaseValue,
  shouldUseCapabilityProxy,
} from '../src/security/accessControl.js'

test('sanitizeAccessControlledRecord strips secret fields but preserves access metadata', () => {
  const sanitized = sanitizeAccessControlledRecord({
    tableName: 'Table 1',
    password: 'legacy-secret',
    passwordHash: 'hashed-secret',
    passwordUpdatedAt: '2026-04-16T00:00:00.000Z',
    accessSecretMode: 'hashed',
    legacyAccess: {
      enabledUntil: '2026-05-16T00:00:00.000Z',
    },
  })

  assert.equal(sanitized.password, undefined)
  assert.equal(sanitized.passwordHash, undefined)
  assert.equal(sanitized.accessRequired, true)
  assert.equal(sanitized.passwordUpdatedAt, '2026-04-16T00:00:00.000Z')
})

test('sanitizeClientDatabaseValue redacts table and player-list secret leaves', () => {
  assert.equal(sanitizeClientDatabaseValue('tables/table-1/password', 'legacy-secret'), '')
  assert.equal(sanitizeClientDatabaseValue('playerLists/list-1/passwordHash', 'hashed-secret'), '')

  const sanitizedCollection = sanitizeClientDatabaseValue('tables', {
    alpha: {
      tableName: 'Alpha',
      password: 'legacy-secret',
      passwordHash: 'hashed-secret',
    },
  })

  assert.deepEqual(sanitizedCollection, {
    alpha: {
      tableName: 'Alpha',
      accessRequired: true,
    },
  })
})

test('hasAccessSecretMetadata recognizes sanitized access-controlled records', () => {
  assert.equal(hasAccessSecretMetadata({
    accessRequired: true,
  }), true)

  assert.equal(hasAccessSecretMetadata({
    accessSecretMode: 'hashed',
    passwordUpdatedAt: '2026-04-16T00:00:00.000Z',
  }), true)

  assert.equal(hasAccessSecretMetadata({
    tableName: 'Open Table',
  }), false)
})

test('shouldUseCapabilityProxy only enables the protected proxy for active capability sessions', () => {
  assert.equal(shouldUseCapabilityProxy({ capabilityToken: '' }), false)
  assert.equal(shouldUseCapabilityProxy({ capabilityToken: null }), false)
  assert.equal(shouldUseCapabilityProxy({ capabilityToken: 'signed.token.value' }), true)
})
