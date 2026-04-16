function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizePath(path) {
  return `${path || ''}`.replace(/^\/+|\/+$/g, '')
}

function hasLegacyAccessMetadata(record) {
  if (!isObject(record.legacyAccess)) {
    return false
  }

  return Object.values(record.legacyAccess).some((value) => typeof value === 'string' && value.length > 0)
}

export function hasAccessSecretMetadata(record) {
  if (!isObject(record)) {
    return false
  }

  if (record.accessRequired === true) {
    return true
  }

  return Boolean(
    (typeof record.password === 'string' && record.password.length > 0) ||
    (typeof record.passwordHash === 'string' && record.passwordHash.length > 0) ||
    (typeof record.passwordUpdatedAt === 'string' && record.passwordUpdatedAt.length > 0) ||
    (typeof record.accessSecretMode === 'string' && record.accessSecretMode.length > 0) ||
    (typeof record.accessVersion === 'number' && record.accessVersion > 0) ||
    hasLegacyAccessMetadata(record)
  )
}

export function sanitizeAccessControlledRecord(record) {
  if (!isObject(record)) {
    return record
  }

  const nextRecord = { ...record }
  delete nextRecord.password
  delete nextRecord.passwordHash
  nextRecord.accessRequired = hasAccessSecretMetadata(record)
  return nextRecord
}

function sanitizeCollection(value) {
  if (!isObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, sanitizeAccessControlledRecord(entry)])
  )
}

export function sanitizeClientDatabaseValue(path, value) {
  const segments = normalizePath(path).split('/').filter(Boolean)
  if (segments.length === 0) {
    return value
  }

  const [root, , field] = segments
  if (root !== 'tables' && root !== 'playerLists') {
    return value
  }

  if (segments.length === 1) {
    return sanitizeCollection(value)
  }

  if (segments.length === 2) {
    return sanitizeAccessControlledRecord(value)
  }

  if (field === 'password' || field === 'passwordHash') {
    return ''
  }

  return value
}

export function shouldUseCapabilityProxy({ capabilityToken }) {
  return typeof capabilityToken === 'string' && capabilityToken.length > 0
}
