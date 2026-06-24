import { v4 as uuidv4 } from 'uuid';
export function newTeam(name, teamLogoURL, players = {}, teamJerseyColor = "") {
    if (Array.isArray(players)) {
        let newPlayersObj = {}
        for (const playerInfo of players) {
            newPlayersObj[uuidv4()] = playerInfo
        }
        players = newPlayersObj
    }
    return {
        teamName: name,
        teamLogoURL: teamLogoURL,
        teamJerseyColor: teamJerseyColor,
        players: players,
        teamManagerPassword: uuidv4()
    }
}
