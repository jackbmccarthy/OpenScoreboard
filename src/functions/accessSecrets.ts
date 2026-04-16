import CryptoJS from 'crypto-js'
import { hasAccessSecretMetadata, sanitizeAccessControlledRecord } from '@/security/accessControl.js'

export type LegacyAccessRecord = {
  enabledUntil?: string
  retiredAt?: string
  lastAccessedAt?: string
  lastIssuedCapabilityAt?: string
}

function getLegacyAccessWindowDays() {
  const rawValue = process.env.NEXT_PUBLIC_LEGACY_ACCESS_WINDOW_DAYS || process.env.LEGACY_ACCESS_WINDOW_DAYS || '30'
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30
}

export function hashAccessSecret(secret: string) {
  return CryptoJS.SHA256(secret).toString()
}

export function buildAccessSecretMetadata(secret: string) {
  const issuedAt = new Date()
  return {
    accessVersion: 2,
    accessSecretMode: 'hashed',
    passwordHash: hashAccessSecret(secret),
    passwordUpdatedAt: issuedAt.toISOString(),
    legacyAccess: {
      enabledUntil: new Date(issuedAt.getTime() + getLegacyAccessWindowDays() * 24 * 60 * 60 * 1000).toISOString(),
      retiredAt: '',
      lastAccessedAt: '',
      lastIssuedCapabilityAt: '',
    },
  }
}

export function getLegacyAccessRecord(record: Record<string, any> | null): LegacyAccessRecord {
  if (!record || typeof record.legacyAccess !== 'object' || !record.legacyAccess) {
    const passwordUpdatedAt = typeof record?.passwordUpdatedAt === 'string' ? record.passwordUpdatedAt : ''
    if (passwordUpdatedAt) {
      return {
        enabledUntil: new Date(new Date(passwordUpdatedAt).getTime() + getLegacyAccessWindowDays() * 24 * 60 * 60 * 1000).toISOString(),
        retiredAt: '',
        lastAccessedAt: '',
        lastIssuedCapabilityAt: '',
      }
    }
    return {}
  }

  const legacyAccess = record.legacyAccess as Record<string, unknown>
  return {
    enabledUntil: typeof legacyAccess.enabledUntil === 'string' ? legacyAccess.enabledUntil : '',
    retiredAt: typeof legacyAccess.retiredAt === 'string' ? legacyAccess.retiredAt : '',
    lastAccessedAt: typeof legacyAccess.lastAccessedAt === 'string' ? legacyAccess.lastAccessedAt : '',
    lastIssuedCapabilityAt: typeof legacyAccess.lastIssuedCapabilityAt === 'string' ? legacyAccess.lastIssuedCapabilityAt : '',
  }
}

export function hasAccessSecret(record: Record<string, any> | null) {
  return hasAccessSecretMetadata(record || null)
}

export function isLegacyAccessAllowed(record: Record<string, any> | null) {
  const legacyAccess = getLegacyAccessRecord(record)

  if (legacyAccess.retiredAt) {
    return false
  }

  if (legacyAccess.enabledUntil) {
    return new Date(legacyAccess.enabledUntil).getTime() > Date.now()
  }

  return true
}

export function isAccessSecretValid(input: string, record: Record<string, any> | null) {
  if (!record) {
    return false
  }

  if (!isLegacyAccessAllowed(record)) {
    return false
  }

  if (typeof record.passwordHash === 'string' && record.passwordHash.length > 0) {
    return hashAccessSecret(input) === record.passwordHash
  }

  // Legacy migration compatibility.
  return typeof record.password === 'string' && input === record.password
}

export function sanitizeClientAccessRecord<T extends Record<string, any> | null>(record: T) {
  return sanitizeAccessControlledRecord(record) as T
}
