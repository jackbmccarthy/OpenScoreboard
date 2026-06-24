import db, { getUserPath } from '../../database';
import { getBracketGroupStyle } from './bracketGroupStyles';
import { getCompetition } from './competitions';

function cleanDisplayUpdates(updates = {}) {
    return Object.entries(updates).reduce((cleanUpdates, [key, value]) => {
        if (typeof value !== "undefined") {
            cleanUpdates[key] = value;
        }
        return cleanUpdates;
    }, {});
}

function getDefaultTitle(displayType) {
    return displayType === "roundRobin" ? "Dynamic Group Display" : "Dynamic Bracket Display";
}

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition";
}

export async function createDynamicBracketGroupDisplay({
    cameraMode = "auto",
    competitionID = "",
    displayType = "singleElimination",
    styleID = "",
    title = "",
} = {}) {
    const timestamp = new Date().toISOString();
    const displayRef = db.ref("dynamicBracketGroups").push();
    const displayID = displayRef.key;
    const cleanTitle = title?.trim() || getDefaultTitle(displayType);
    const display = {
        cameraMode,
        competitionID,
        createdOn: timestamp,
        deleted: false,
        displayType,
        id: displayID,
        ownerID: getUserPath(),
        styleID,
        title: cleanTitle,
        updatedOn: timestamp,
    };

    await displayRef.set(display);
    await db.ref(`users/${getUserPath()}/myDynamicBracketGroups`).push({
        cameraMode,
        competitionID,
        createdOn: timestamp,
        displayType,
        id: displayID,
        styleID,
        title: cleanTitle,
        updatedOn: timestamp,
    });

    return display;
}

export async function getMyDynamicBracketGroupDisplays(userID = getUserPath()) {
    const snapshot = await db.ref(`users/${userID}/myDynamicBracketGroups`).get();
    const displays = snapshot.val();

    if (!displays || typeof displays !== "object") {
        return [];
    }

    return Promise.all(Object.entries(displays).map(async ([myDisplayID, data]: any) => {
        const displayID = data?.id;
        const displaySnapshot = displayID ? await db.ref(`dynamicBracketGroups/${displayID}`).get() : null;
        const display = displaySnapshot?.val() || {};
        const competitionID = display?.competitionID || data?.competitionID || "";
        const styleID = display?.styleID || data?.styleID || "";
        const [competition, style] = await Promise.all([
            competitionID ? getCompetition(competitionID) : Promise.resolve(null),
            styleID ? getBracketGroupStyle(styleID) : Promise.resolve(null),
        ]);

        return [myDisplayID, {
            ...data,
            ...display,
            competitionTitle: competition ? getCompetitionTitle(competition) : "",
            styleTitle: style?.title || (styleID ? "Display style" : "Default style"),
            title: display?.title || data?.title || getDefaultTitle(display?.displayType || data?.displayType),
        }];
    }));
}

export async function updateDynamicBracketGroupDisplay(myDisplayID, updates = {}) {
    const timestamp = new Date().toISOString();
    const displayIDSnapshot = await db.ref(`users/${getUserPath()}/myDynamicBracketGroups/${myDisplayID}/id`).get();
    const displayID = displayIDSnapshot.val();
    const cleanUpdates = cleanDisplayUpdates({
        ...updates,
        cameraMode: updates?.cameraMode || "auto",
        title: updates?.title?.trim() || getDefaultTitle(updates?.displayType),
        updatedOn: timestamp,
    });

    await Promise.all([
        db.ref(`dynamicBracketGroups/${displayID}`).update(cleanUpdates),
        db.ref(`users/${getUserPath()}/myDynamicBracketGroups/${myDisplayID}`).update(cleanUpdates),
    ]);
}

export async function deleteDynamicBracketGroupDisplay(myDisplayID) {
    const displayIDSnapshot = await db.ref(`users/${getUserPath()}/myDynamicBracketGroups/${myDisplayID}/id`).get();
    const displayID = displayIDSnapshot.val();

    await Promise.all([
        db.ref(`users/${getUserPath()}/myDynamicBracketGroups/${myDisplayID}`).remove(),
        displayID ? db.ref(`dynamicBracketGroups/${displayID}`).remove() : Promise.resolve(),
    ]);
}
