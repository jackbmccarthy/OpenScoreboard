import db, { getUserPath } from '../../database';
import { v4 as uuidv4 } from 'uuid';

function nowTimestamp() {
    return new Date().toISOString()
}

export async function addNewTeam(team: any) {
    const ownerID = getUserPath()
    const teamManagerPassword = team.teamManagerPassword || uuidv4()
    const publicTeam = {
        ...team,
        ownerID,
    }
    delete publicTeam.teamManagerPassword

    let pushedTeam = await db.ref(`teams`).push(publicTeam)
    await Promise.all([
        db.ref(`teamManagerSecrets/${pushedTeam.key}`).set(teamManagerPassword),
        db.ref(`teamManagerAccess/${pushedTeam.key}/${teamManagerPassword}`).set(true),
    ])
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeams").push({
        id: pushedTeam.key,
        createdOn: new Date(),
        name: team.teamName,
        teamLogoURL: team.teamLogoURL || "",
        teamJerseyColor: team.teamJerseyColor || "",
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
                const teamManagerPassword = myTeam?.id ? await ensureTeamManagerPassword(myTeam.id, team || {}) : ""
                return [
                    myTeamID,
                    {
                        ...myTeam,
                        name: team?.teamName || myTeam?.name || "",
                        teamLogoURL: team?.teamLogoURL || myTeam?.teamLogoURL || "",
                        teamJerseyColor: team?.teamJerseyColor || myTeam?.teamJerseyColor || "",
                        teamManagerPassword,
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
    await db.ref(`teamManagerAccess/${teamID}`).remove()
    await Promise.all([
        db.ref(`teamManagerSecrets/${teamID}`).set(newPassword),
        db.ref(`teamManagerAccess/${teamID}/${newPassword}`).set(true),
        db.ref(`teams/${teamID}`).update({
            modifiedOn: nowTimestamp(),
            ownerID: getUserPath(),
            teamManagerPassword: null,
        }),
    ])
    return newPassword
}

export async function ensureTeamManagerPassword(teamID, team: any = {}) {
    if (!team?.ownerID) {
        await db.ref(`teams/${teamID}/ownerID`).set(getUserPath())
    }

    const managerSecretSnapshot = await db.ref(`teamManagerSecrets/${teamID}`).get()
    const existingSecret = managerSecretSnapshot.val()
    if (existingSecret) {
        return existingSecret
    }

    const password = team?.teamManagerPassword || uuidv4()
    await Promise.all([
        db.ref(`teamManagerSecrets/${teamID}`).set(password),
        db.ref(`teamManagerAccess/${teamID}/${password}`).set(true),
        db.ref(`teams/${teamID}`).update({
            ownerID: team?.ownerID || getUserPath(),
            teamManagerPassword: null,
        }),
    ])
    return password
}

export async function validateTeamManagerPassword(teamID, password) {
    if (!teamID || !password) {
        return false
    }

    try {
        const accessSnapshot = await db.ref(`teamManagerAccess/${teamID}/${password}`).get()
        if (accessSnapshot.val() === true) {
            return true
        }
    }
    catch {
        // Existing teams may still use the legacy token until the owner next opens them.
    }

    const legacyTeam = await getTeam(teamID)
    return legacyTeam?.teamManagerPassword === password
}


export async function updateTeam(teamID, team: any) {
    const publicTeam = {
        ...team,
        ownerID: team?.ownerID || getUserPath(),
    }
    delete publicTeam.teamManagerPassword
    let pushedTeam = await db.ref(`teams/${teamID}`).set(publicTeam)
}
export async function updateMyTeam(myTeamID, name, teamLogoURL, teamJerseyColor) {
    const updates: any = { name }

    if (typeof teamLogoURL !== "undefined") {
        updates.teamLogoURL = teamLogoURL || ""
    }

    if (typeof teamJerseyColor !== "undefined") {
        updates.teamJerseyColor = teamJerseyColor || ""
    }

    let pushedTeam = await db.ref("users" + "/" + getUserPath() + "/" + "myTeams/" + myTeamID).update(updates)
}
