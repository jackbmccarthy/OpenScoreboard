import db, { getUserPath } from '../lib/database';
import { getPreviewValue, isRecordActive, softDeleteCanonical } from './deletion';

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
        return Promise.all(Object.entries(myTeams).map(async ([myTeamID, preview]) => {
            const previewEntry = preview as Record<string, any>
            const teamID = previewEntry?.id
            if (typeof teamID !== 'string' || teamID.length === 0) {
                return null
            }
            const teamSnapshot = await db.ref(`teams/${teamID}`).get()
            if (!isRecordActive(teamSnapshot.val())) {
                return null
            }
            return [myTeamID, previewEntry]
        })).then((entries) => entries.filter((entry): entry is [string, Record<string, any>] => Boolean(entry)))
    }
    else {
        return []
    }

}

export async function deleteMyTeam(myTeamID) {
    const previewPath = `users/${getUserPath()}/myTeams/${myTeamID}`
    const preview = await getPreviewValue(previewPath)
    const teamID = preview?.id
    if (typeof teamID === 'string' && teamID.length > 0) {
        await softDeleteCanonical(`teams/${teamID}`, {
            deleteReason: 'delete_team'
        }, {
            entityType: 'team',
            canonicalID: teamID,
            ownerID: getUserPath(),
            previewPath,
        })
    }
    await db.ref(previewPath).remove()


}

export async function getTeam(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}`).get()
    const team = pushedTeam.val()
    return isRecordActive(team)
        ? { ...team, players: team.players || team.teamPlayers || {} }
        : null
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
    return myTeams.find((entry) => entry?.[1]?.id === teamID) || null
}
