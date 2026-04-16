import db, { getUserPath } from '../lib/database';
import { subscribeToPathValue } from '../lib/realtime';
import { subscribeToOwnedCanonicalCollection } from '@/lib/liveSync'
import type { OwnershipMutationOptions } from './deletion';
import { getPreviewValue, isRecordActive, softDeleteCanonical } from './deletion';

type TeamRecord = {
    ownerID?: string
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

function normalizeTeam(team: unknown, ownerID = getUserPath()) {
    const safeTeam = (team && typeof team === 'object' ? team : {}) as TeamRecord

    return {
        ownerID: safeTeam.ownerID || ownerID,
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
    const normalizedTeam = normalizeTeam(team, getUserPath())
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
    return subscribeToOwnedCanonicalCollection<Record<string, any>, TeamRecord, MyTeamPreview>({
        ownerPath: `users/${userID}/myTeams`,
        getCanonicalID: (preview) => typeof preview?.id === 'string' ? preview.id : '',
        getCanonicalPath: (teamID) => `teams/${teamID}`,
        isCanonicalActive: (team) => isRecordActive(team),
        buildRow: ({ canonicalID, preview, canonical }) => {
            const normalizedTeam = normalizeTeam(canonical)
            return {
                ...preview,
                id: canonicalID,
                name: preview?.name || normalizedTeam.teamName,
                teamLogoURL: normalizedTeam.teamLogoURL,
                players: normalizedTeam.players,
                tags: normalizedTeam.tags,
            }
        },
    }, (teams) => callback(teams.filter(isMyTeamEntry)))
}

export function subscribeToTeam(
    teamID: string,
    callback: (team: Record<string, any> | null) => void,
) {
    return subscribeToPathValue(`teams/${teamID}`, (teamValue) => {
        callback(isRecordActive(teamValue) ? normalizeTeam(teamValue as TeamRecord, String((teamValue as TeamRecord)?.ownerID || '')) : null)
    })
}

export async function deleteMyTeam(myTeamID, options: OwnershipMutationOptions = {}) {
    const previewPath = `users/${getUserPath()}/myTeams/${myTeamID}`
    const preview = await getPreviewValue(previewPath)
    const teamID = preview?.id
    const activeTeamMatchRefs = typeof teamID === 'string' && teamID.length > 0
        ? await getActiveTeamMatchRefs(teamID)
        : []

    const report = {
        entityType: 'team',
        canonicalID: typeof teamID === 'string' ? teamID : '',
        canonicalPath: typeof teamID === 'string' && teamID.length > 0 ? `teams/${teamID}` : '',
        previewPath,
        dryRun: Boolean(options.dryRun),
        deleteMode: 'soft_deleted',
        ownerID: getUserPath(),
        dependentIDs: {
            activeTeamMatchRefs,
        },
    }

    if (typeof teamID === 'string' && teamID.length > 0) {
        await softDeleteCanonical(`teams/${teamID}`, {
            deleteReason: 'delete_team',
            clearedTeamMatchRefs: activeTeamMatchRefs,
        }, {
            entityType: 'team',
            canonicalID: teamID,
            ownerID: getUserPath(),
            previewPath,
        }, options)
    }
    if (!options.dryRun) {
        await db.ref(previewPath).remove()
    }

    return report


}

export async function getTeam(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}`).get()
    const team = pushedTeam.val()
    return isRecordActive(team)
        ? normalizeTeam(team, String(team?.ownerID || ''))
        : null
}

export async function getTeamName(teamID) {
    let pushedTeam = await db.ref(`teams/${teamID}/teamName`).get()
    return pushedTeam.val()
}


export async function updateTeam(teamID, team) {
    const currentTeam = await db.ref(`teams/${teamID}`).get()
    let pushedTeam = await db.ref(`teams/${teamID}`).set(normalizeTeam({
        ...(currentTeam.val() || {}),
        ...(team || {}),
    }, String(currentTeam.val()?.ownerID || getUserPath())))
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
