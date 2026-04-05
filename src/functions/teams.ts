import db, { getUserPath } from '../lib/database';

function normalizeTeam(team) {
    return {
        teamName: team?.teamName || team?.name || "",
        teamLogoURL: team?.teamLogoURL || "",
        players: team?.players || team?.teamPlayers || {}
    }
}

export async function addNewTeam(team,) {
    const normalizedTeam = normalizeTeam(team)
    let pushedTeam = await db.ref(`teams`).push(normalizedTeam)
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeams").push({
        id: pushedTeam.key,
        createdOn: new Date(),
        name: normalizedTeam.teamName,
    })
    return pushedTeam.key
}

export async function getMyTeams(userID = getUserPath()) {

    let myTeams = await db.ref("users" + "/" + userID + "/" + "myTeams").get()
    myTeams = myTeams.val()
    if (typeof myTeams === "object" && myTeams !== null) {
        return Object.entries(myTeams)
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
    const team = pushedTeam.val()
    return team
        ? { ...team, players: team.players || team.teamPlayers || {} }
        : team
}

export async function getTeamName(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}/teamName`).get()
    return pushedTeam.val()
}


export async function updateTeam(teamID, team) {
    let pushedTeam = await db.ref(`teams/${teamID}`).set(normalizeTeam(team))
    return pushedTeam
}
export async function updateMyTeam(myTeamID, name) {
    let pushedTeam = await db.ref("users" + "/" + getUserPath() + "/" + "myTeams/" + myTeamID + "/name").set(name)
    return pushedTeam
}

export async function getMyTeamEntryByTeamID(teamID) {
    const myTeams = await getMyTeams(getUserPath())
    return myTeams.find(([, team]) => team?.id === teamID) || null
}
