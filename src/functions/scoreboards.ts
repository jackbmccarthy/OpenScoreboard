import db, { getUserPath } from "../lib/database";
import { subscribeToPathValue } from "../lib/realtime";
import { subscribeToOwnedCanonicalCollection } from '@/lib/liveSync'
import { newScoreboard } from "../classes/Scoreboard";
import type { OwnershipMutationOptions } from './deletion';
import { clearScoreboardIdFromTables, getPreviewValue, isRecordActive, revokeCapabilityLinksByReference, softDeleteCanonical, softDeleteDynamicURLsByReference } from './deletion';


export async function getMyScoreboards(userID,) {

    let myScoreboardsSnap = await db.ref("users" + "/" + userID + "/" + "myScoreboards").get()
    let myScoreboards = myScoreboardsSnap.val()
    if (myScoreboards !== null && typeof myScoreboards === "object") {
        return Promise.all(Object.entries(myScoreboards).map(async ([myScoreboardID, preview]) => {
            const previewEntry = preview as Record<string, any>
            const scoreboardID = previewEntry?.id
            if (typeof scoreboardID !== 'string' || scoreboardID.length === 0) {
                return null
            }
            const scoreboardSnapshot = await db.ref(`scoreboards/${scoreboardID}`).get()
            if (!isRecordActive(scoreboardSnapshot.val())) {
                return null
            }
            return [myScoreboardID, previewEntry]
        })).then((entries) => entries.filter(Boolean))
    }
    else {
        return []
    }

}

export function subscribeToMyScoreboards(
    callback: (scoreboards: Array<[string, Record<string, any>]>) => void,
    userID = getUserPath(),
) {
    return subscribeToOwnedCanonicalCollection<Record<string, any>, Record<string, any>, Record<string, any>>({
        ownerPath: `users/${userID}/myScoreboards`,
        getCanonicalID: (preview) => typeof preview?.id === 'string' ? preview.id : '',
        getCanonicalPath: (scoreboardID) => `scoreboards/${scoreboardID}`,
        isCanonicalActive: (scoreboard) => isRecordActive(scoreboard),
        buildRow: ({ canonicalID, preview, canonical }) => ({
            ...preview,
            id: canonicalID,
            name: typeof canonical?.name === 'string' ? canonical.name : preview?.name || '',
            type: typeof canonical?.type === 'string' ? canonical.type : preview?.type || 'liveStream',
            web: canonical?.web && typeof canonical.web === 'object' ? canonical.web : preview?.web || {},
        }),
    }, callback)
}

export async function deleteMyScoreboard(myScoreboardID, options: OwnershipMutationOptions = {}) {
    const previewPath = `users/${getUserPath()}/myScoreboards/${myScoreboardID}`
    const preview = await getPreviewValue(previewPath)
    const scoreboardID = preview?.id
    const report = {
        entityType: 'scoreboard',
        canonicalID: typeof scoreboardID === 'string' ? scoreboardID : '',
        canonicalPath: typeof scoreboardID === 'string' && scoreboardID.length > 0 ? `scoreboards/${scoreboardID}` : '',
        previewPath,
        dryRun: Boolean(options.dryRun),
        deleteMode: 'soft_deleted',
        ownerID: getUserPath(),
        dependentIDs: {
            clearedTables: [] as string[],
            dynamicURLs: [] as string[],
            revokedCapabilityTokenIDs: [] as string[],
        },
    }
    if (typeof scoreboardID === 'string' && scoreboardID.length > 0) {
        const clearedTables = await clearScoreboardIdFromTables(scoreboardID, options)
        const softDeletedDependents = {
            dynamicURLs: await softDeleteDynamicURLsByReference({ scoreboardID, reason: 'parent_scoreboard_soft_deleted' }, options),
        }
        const revokedCapabilityTokenIDs = await revokeCapabilityLinksByReference({
            scoreboardID,
            reason: 'parent_scoreboard_soft_deleted',
        }, options)
        await softDeleteCanonical(`scoreboards/${scoreboardID}`, {
            deleteReason: 'delete_scoreboard',
            clearedTables,
            softDeletedDependents,
            revokedCapabilityTokenIDs,
        }, {
            entityType: 'scoreboard',
            canonicalID: scoreboardID,
            ownerID: getUserPath(),
            previewPath,
            dependents: softDeletedDependents,
        }, options)
        report.dependentIDs = {
            clearedTables,
            dynamicURLs: softDeletedDependents.dynamicURLs,
            revokedCapabilityTokenIDs,
        }
    }
    if (!options.dryRun) {
        await db.ref(previewPath).remove()
    }
    return report
}


export function getScoreboardTypesList() {
    return [
        {
            id: "liveStream",
            name: "Live Stream"
        }
        ,

    ]
}

export async function addNewScoreboard(name, type) {
    let scoreboard = newScoreboard(getUserPath(), name, type)
    let newlyAdded = await db.ref("scoreboards").push(scoreboard)

    await db.ref("users" + "/" + getUserPath() + "/" + "myScoreboards").push({
        id: newlyAdded.key,
        createdOn: new Date(),
        name: name,
        type: type
    })
    return newlyAdded.key
}

export async function getScoreboard(scoreboardID) {
    const snapshot = await db.ref(`scoreboards/${scoreboardID}`).get()
    const scoreboard = snapshot.val()
    return isRecordActive(scoreboard) ? scoreboard : null
}

export async function duplicateScoreboard(sourceScoreboardID, myScoreboardName) {
    const scoreboard = await getScoreboard(sourceScoreboardID)
    if (!scoreboard) {
        return null
    }

    const duplicated = {
        ...scoreboard,
        ownerID: getUserPath(),
        name: myScoreboardName || `${scoreboard.name || 'Scoreboard'} Copy`,
    }

    const newlyAdded = await db.ref("scoreboards").push(duplicated)
    await db.ref(`users/${getUserPath()}/myScoreboards`).push({
        id: newlyAdded.key,
        createdOn: new Date(),
        name: duplicated.name,
        type: duplicated.type || 'liveStream'
    })

    return newlyAdded.key
}

export async function updateScoreboardDetails(scoreboardID, myScoreboardID, name, type) {
    await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/name`).set(name),
        db.ref(`scoreboards/${scoreboardID}/type`).set(type),
        db.ref(`users/${getUserPath()}/myScoreboards/${myScoreboardID}/name`).set(name),
        db.ref(`users/${getUserPath()}/myScoreboards/${myScoreboardID}/type`).set(type),
    ])
}

export async function getScoreboardSettings(scoreboardID) {
    let settings = await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/showDuringActiveMatch`).get(),
        db.ref(`scoreboards/${scoreboardID}/showDuringTimeOuts`).get(),
        db.ref(`scoreboards/${scoreboardID}/alwaysShow`).get(),
        db.ref(`scoreboards/${scoreboardID}/showInBetweenGames`).get(),
    ])
    let scoreboard = {
        showDuringActiveMatch: settings[0].val(),
        showDuringTimeOuts: settings[1].val(),
        alwaysShow: settings[2].val(),
        showInBetweenGames: settings[3].val()
    }
    return scoreboard

}

export async function setScoreboardSettings(scoreboardID, showDuringActiveMatch, showDuringTimeOuts, showInBetweenGames, alwaysShow) {
    let settings = await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/showDuringActiveMatch`).set(showDuringActiveMatch),
        db.ref(`scoreboards/${scoreboardID}/showDuringTimeOuts`).set(showDuringTimeOuts),
        db.ref(`scoreboards/${scoreboardID}/alwaysShow`).set(alwaysShow),
        db.ref(`scoreboards/${scoreboardID}/showInBetweenGames`).set(showInBetweenGames),
    ])


}
