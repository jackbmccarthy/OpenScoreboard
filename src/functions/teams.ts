import db, { getUserPath } from '../lib/database';
import { subscribeToPathValue } from '../lib/realtime';
import { getPreviewValue, isRecordActive, softDeleteCanonical } from './deletion';

type TeamRecord = {
    teamName?: string
    name?: string
    teamLogoURL?: string
    players?: Record<string, any>
    teamPlayers?: Record<string, any>
    tags?: unknown
}

type MyTeamPreview = {
    id: string
    name: string
    createdOn?: Date | string
    teamLogoURL: string
    players: Record<string, any>
    tags: string[]
    [key: string]: any
}

type MyTeamEntry = [string, MyTeamPreview]

function isMyTeamEntry(entry: MyTeamEntry | null): entry is MyTeamEntry {
    return entry !== null
}

function normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) {
        return []
    }

    const seen = new Set<string>()
    const normalizedTags: string[] = []

    tags.forEach((tag) => {
        if (typeof tag !== 'string') {
            return
        }
        const normalizedTag = tag.trim().replace(/\s+/g, ' ')
        if (!normalizedTag) {
            return
        }
        const tagKey = normalizedTag.toLowerCase()
        if (seen.has(tagKey)) {
            return
        }
        seen.add(tagKey)
        normalizedTags.push(normalizedTag)
    })

    return normalizedTags
}

function normalizeTeam(team: unknown) {
    const safeTeam = (team && typeof team === 'object' ? team : {}) as TeamRecord

    return {
        teamName: safeTeam.teamName || safeTeam.name || "",
        teamLogoURL: safeTeam.teamLogoURL || "",
        players: safeTeam.players || safeTeam.teamPlayers || {},
        tags: normalizeTags(safeTeam.tags),
    }
}

/**
 * Returns team match IDs (canonical) that still have an active reference to the given team.
 * Used to detect dangling references before deleting a team.
 */
async function getActiveTeamMatchRefs(teamID: string): Promise<string[]> {
    const snapshot = await db.ref('teamMatches').get()
    const teamMatches = snapshot.val()
    if (!teamMatches || typeof teamMatches !== 'object') {
        return []
    }
    const refs: string[] = []
    for (const [teamMatchID, teamMatch] of Object.entries(teamMatches)) {
        const candidate = teamMatch as Record<string, any>
        if (
            isRecordActive(candidate) &&
            (candidate.teamAID === teamID || candidate.teamBID === teamID)
        ) {
            refs.push(teamMatchID)
        }
    }
    return refs
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

export async function getMyTeams(userID = getUserPath()): Promise<MyTeamEntry[]> {

    let myTeams = await db.ref("users" + "/" + userID + "/" + "myTeams").get()
    myTeams = myTeams.val()
    if (typeof myTeams === "object" && myTeams !== null) {
        return Promise.all(Object.entries(myTeams).map(async ([myTeamID, preview]): Promise<MyTeamEntry | null> => {
            const previewEntry = preview as Record<string, any>
            const teamID = previewEntry?.id
            if (typeof teamID !== 'string' || teamID.length === 0) {
                return null
            }
            const teamSnapshot = await db.ref(`teams/${teamID}`).get()
            if (!isRecordActive(teamSnapshot.val())) {
                return null
            }
            const normalizedTeam = normalizeTeam(teamSnapshot.val())
            return [myTeamID, {
                ...previewEntry,
                id: teamID,
                name: previewEntry?.name || normalizedTeam.teamName,
                teamLogoURL: normalizedTeam.teamLogoURL,
                players: normalizedTeam.players,
                tags: normalizedTeam.tags,
            }]
        })).then((entries) => entries.filter(isMyTeamEntry))
    }
    else {
        return []
    }

}

export function subscribeToMyTeams(
    callback: (teams: MyTeamEntry[]) => void,
    userID = getUserPath(),
) {
    return subscribeToPathValue(`users/${userID}/myTeams`, async (myTeamsValue) => {
        const teams = myTeamsValue && typeof myTeamsValue === "object"
            ? await Promise.all(Object.entries(myTeamsValue as Record<string, unknown>).map(async ([myTeamID, preview]): Promise<MyTeamEntry | null> => {
                const previewEntry = preview as Record<string, any>
                const teamID = previewEntry?.id
                if (typeof teamID !== 'string' || teamID.length === 0) {
                    return null
                }
                const teamSnapshot = await db.ref(`teams/${teamID}`).get()
                if (!isRecordActive(teamSnapshot.val())) {
                    return null
                }
                const normalizedTeam = normalizeTeam(teamSnapshot.val())
                return [myTeamID, {
                    ...previewEntry,
                    id: teamID,
                    name: previewEntry?.name || normalizedTeam.teamName,
                    teamLogoURL: normalizedTeam.teamLogoURL,
                    players: normalizedTeam.players,
                    tags: normalizedTeam.tags,
                }]
            }))
            : []
        callback(teams.filter(isMyTeamEntry))
    })
}

export function subscribeToTeam(
    teamID: string,
    callback: (team: Record<string, any> | null) => void,
) {
    return subscribeToPathValue(`teams/${teamID}`, (teamValue) => {
        callback(isRecordActive(teamValue) ? normalizeTeam(teamValue as TeamRecord) : null)
    })
}

export async function deleteMyTeam(myTeamID) {
    const previewPath = `users/${getUserPath()}/myTeams/${myTeamID}`
    const preview = await getPreviewValue(previewPath)
    const teamID = preview?.id
    if (typeof teamID === 'string' && teamID.length > 0) {
        const activeTeamMatchRefs = await getActiveTeamMatchRefs(teamID)
        await softDeleteCanonical(`teams/${teamID}`, {
            deleteReason: 'delete_team',
            clearedTeamMatchRefs: activeTeamMatchRefs,
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
        ? normalizeTeam(team)
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
