import { v4 as uuidv4 } from 'uuid';
export function newTeam(name, teamLogoURL, players={}){
    if(Array.isArray(players)){
        let newPlayersObj = {}
        for (const playerInfo of players) {
            newPlayersObj[uuidv4()] = playerInfo
        }
        players = newPlayersObj
    }
    return {
        teamName:name,
        teamLogoURL:teamLogoURL,
        players:players
    }
}