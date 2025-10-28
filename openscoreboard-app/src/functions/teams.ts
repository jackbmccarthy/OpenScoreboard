import db, { getUserPath } from '../../database';

export async function addNewTeam(team,) {
    let pushedTeam = await db.ref(`teams`).push(team)
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeams").push({
        id: pushedTeam.key,
        createdOn: new Date(),
        name: team.teamName,
    })
}

export async function getMyTeams(userID,) {

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
    return pushedTeam.val()
}

export async function getTeamName(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}/teamName`).get()
    return pushedTeam.val()
}


export async function updateTeam(teamID, team) {
    let pushedTeam = await db.ref(`teams/${teamID}`).set(team)
}
export async function updateMyTeam(myTeamID, name) {
    let pushedTeam = await db.ref("users" + "/" + getUserPath() + "/" + "myTeams/" + myTeamID + "/name").set(name)
}