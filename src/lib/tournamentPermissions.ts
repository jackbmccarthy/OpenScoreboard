import type { TournamentGrantRole } from '@/functions/tournaments'

export function canManageTournament(role: TournamentGrantRole | null) {
  return role === 'owner' || role === 'admin'
}

export function canViewTournament(role: TournamentGrantRole | null) {
  return role === 'owner' || role === 'admin' || role === 'scorer' || role === 'viewer'
}

export function canTransferTournament(role: TournamentGrantRole | null) {
  return role === 'owner'
}

export function getTournamentCardCapabilities(role: TournamentGrantRole | null) {
  return {
    canManage: canManageTournament(role),
    canTransfer: canTransferTournament(role),
    canView: canViewTournament(role),
  }
}
