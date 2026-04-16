import { v4 as uuidv4 } from 'uuid';
import type { Player, Team as TeamRecord } from '../types/matches';

export function newTeam(name: string, teamLogoURL: string, players: Record<string, Player> | Player[] = {}, tags: string[] = []): TeamRecord {
    if (Array.isArray(players)) {
        let newPlayersObj: Record<string, Player> = {}
        for (const playerInfo of players) {
            newPlayersObj[uuidv4()] = playerInfo
        }
        players = newPlayersObj
    }
    return {
        teamName: name,
        teamLogoURL: teamLogoURL,
        players: players,
        tags: tags,
    }
}
