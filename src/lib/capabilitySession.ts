let currentCapabilityToken = ''

export function setCurrentCapabilityToken(token: string | null) {
  currentCapabilityToken = token || ''
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem('openscoreboard_capability_token', token)
    } else {
      window.sessionStorage.removeItem('openscoreboard_capability_token')
    }
  }
}

export function getCurrentCapabilityToken() {
  if (currentCapabilityToken) {
    return currentCapabilityToken
  }

  if (typeof window !== 'undefined') {
    currentCapabilityToken = window.sessionStorage.getItem('openscoreboard_capability_token') || ''
  }

  return currentCapabilityToken
}

export function clearCurrentCapabilityToken() {
  setCurrentCapabilityToken(null)
}
