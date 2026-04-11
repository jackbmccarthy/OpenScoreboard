import { v4 as uuidv4 } from 'uuid';
export function newTeam(name: string, teamLogoURL: string, players: any = {}, tags: string[] = []) {
    if (Array.isArray(players)) {
        let newPlayersObj: Record<string, any> = {}
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
