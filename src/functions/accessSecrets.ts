import CryptoJS from 'crypto-js'

export function hashAccessSecret(secret: string) {
  return CryptoJS.SHA256(secret).toString()
}

export function buildAccessSecretMetadata(secret: string) {
  return {
    accessVersion: 1,
    accessSecretMode: 'hashed',
    passwordHash: hashAccessSecret(secret),
    passwordUpdatedAt: new Date().toISOString(),
  }
}

export function hasAccessSecret(record: Record<string, any> | null) {
  return Boolean(
    record &&
    (
      (typeof record.passwordHash === 'string' && record.passwordHash.length > 0) ||
      (typeof record.password === 'string' && record.password.length > 0)
    )
  )
}

export function isAccessSecretValid(input: string, record: Record<string, any> | null) {
  if (!record) {
    return false
  }

  if (typeof record.passwordHash === 'string' && record.passwordHash.length > 0) {
    return hashAccessSecret(input) === record.passwordHash
  }

  // Legacy migration compatibility.
  return typeof record.password === 'string' && input === record.password
}
