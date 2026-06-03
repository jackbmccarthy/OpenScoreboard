import db, { getUserPath } from '../../database';
import { v4 as uuidv4 } from 'uuid';

function nowTimestamp() {
    return new Date().toISOString()
}

export async function addNewTeam(team,) {
    let pushedTeam = await db.ref(`teams`).push(team)
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeams").push({
        id: pushedTeam.key,
        createdOn: new Date(),
        name: team.teamName,
        teamLogoURL: team.teamLogoURL || "",
    })
}

export async function getMyTeams(userID,) {

    let myTeams = await db.ref("users" + "/" + userID + "/" + "myTeams").get()
    myTeams = myTeams.val()
    if (typeof myTeams === "object" && myTeams !== null) {
        const entries = Object.entries(myTeams)
        return Promise.all(entries.map(async ([myTeamID, myTeam]) => {
            try {
                const team = myTeam?.id ? await getTeam(myTeam.id) : null
                return [
                    myTeamID,
                    {
                        ...myTeam,
                        name: team?.teamName || myTeam?.name || "",
                        teamLogoURL: team?.teamLogoURL || myTeam?.teamLogoURL || "",
                        players: team?.players || myTeam?.players || {},
                    },
                ]
            }
            catch {
                return [myTeamID, myTeam]
            }
        }))
    }
    else {
        return []
    }

}

export async function deleteMyTeam(myTeamID) {

    await db.ref(`users/${getUserPath()}/myTeams/${myTeamID}`).remove()


}

export async function getTeam(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}`).get()
    return pushedTeam.val()
}

export async function getTeamName(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}/teamName`).get()
    return pushedTeam.val()
}

export async function resetTeamManagerPassword(teamID) {
    const newPassword = uuidv4()
    await db.ref(`teams/${teamID}`).update({
        teamManagerPassword: newPassword,
        modifiedOn: nowTimestamp(),
    })
    return newPassword
}

export async function ensureTeamManagerPassword(teamID, team = {}) {
    if (team?.teamManagerPassword) {
        return team.teamManagerPassword
    }

    return resetTeamManagerPassword(teamID)
}


export async function updateTeam(teamID, team) {
    let pushedTeam = await db.ref(`teams/${teamID}`).set(team)
}
export async function updateMyTeam(myTeamID, name, teamLogoURL) {
    const updates = { name }

    if (typeof teamLogoURL !== "undefined") {
        updates.teamLogoURL = teamLogoURL || ""
    }

    let pushedTeam = await db.ref("users" + "/" + getUserPath() + "/" + "myTeams/" + myTeamID).update(updates)
}
