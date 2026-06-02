import db from '../database';
import { conditionalShowFieldList } from './fields/conditionalShowFieldList';
import { courtSideGameFieldList } from './fields/courtSideGameFieldList';
import { currentGameFieldList } from './fields/currentGameFieldList';
import { imageFieldList } from './fields/imageFieldList';
import { solidColorFieldList } from './fields/solidColorFieldList';
import { textFieldList } from './fields/textFieldList';
import { timeOutTimerFieldList } from './fields/timeOutTimerFieldList';
import { getBroadcastChannelName } from './getBroadcastChannelName';

const extraMatchListenerFields = [
    "timeOutStartTimeA",
    "timeOutStartTimeB",
];

function isRecord(value) {
    return value !== null && typeof value === "object";
}

function unwrapCursorValue(value) {
    if (isRecord(value) && Object.keys(value).includes("cursor")) {
        return value["value"];
    }

    return value;
}

function postFieldUpdate(key, fieldValue) {
    const fieldData = { [key]: fieldValue };
    if (key.toLowerCase().includes("timeout")) {
        console.log("OpenScoreboard timeout field update", fieldData);
    }

    if (typeof BroadcastChannel !== "undefined") {
        let bc = new BroadcastChannel(key + getBroadcastChannelName());
        bc.postMessage(fieldData);
        bc.close();
    }

    window.postMessage(fieldData);
    window.dispatchEvent(new CustomEvent("open-scoreboard-field-update", { detail: fieldData }));
}

function valuesMatch(previousValue, nextValue) {
    if (Object.is(previousValue, nextValue)) {
        return true;
    }

    if (!isRecord(previousValue) && !isRecord(nextValue)) {
        return false;
    }

    try {
        return JSON.stringify(previousValue) === JSON.stringify(nextValue);
    } catch (error) {
        return false;
    }
}

function getDerivedTimeOutActive(matchValues) {
    return matchValues.isATimeOutActive === true || matchValues.isBTimeOutActive === true;
}

function postMatchFieldUpdates(matchValues, previousMatchValues = null) {
    if (!isRecord(matchValues)) {
        return;
    }

    for (const key of Object.keys(matchValues)) {
        const fieldValue = matchValues[key];
        const previousValue = isRecord(previousMatchValues) ? previousMatchValues[key] : undefined;

        if (!isRecord(previousMatchValues) || !valuesMatch(previousValue, fieldValue)) {
            postFieldUpdate(key, fieldValue);
        }
    }

    const isTimeOutActive = getDerivedTimeOutActive(matchValues);
    const wasTimeOutActive = isRecord(previousMatchValues) ? getDerivedTimeOutActive(previousMatchValues) : undefined;

    if (!isRecord(previousMatchValues) || wasTimeOutActive !== isTimeOutActive) {
        postFieldUpdate("isTimeOutActive", isTimeOutActive);
    }
}

function cloneMatchValues(matchValues) {
    try {
        return JSON.parse(JSON.stringify(matchValues));
    } catch (error) {
        return matchValues;
    }
}

function getFieldListenerKeys(matchValues) {
    const keys = new Set<string>(isRecord(matchValues) ? Object.keys(matchValues) : []);
    const fieldLists = [
        conditionalShowFieldList,
        courtSideGameFieldList,
        currentGameFieldList,
        imageFieldList,
        solidColorFieldList,
        textFieldList,
        timeOutTimerFieldList,
    ];

    for (const field of extraMatchListenerFields) {
        keys.add(field);
    }

    for (const item of fieldLists) {
        if (item.field) {
            keys.add(item.field);
        }

        if (Array.isArray(item.requiredFields)) {
            for (const field of item.requiredFields) {
                keys.add(field);
            }
        }
    }

    return Array.from(keys);
}

function postDerivedFieldUpdates(matchValues, previousMatchValues = null) {
    const isTimeOutActive = getDerivedTimeOutActive(matchValues);
    const wasTimeOutActive = isRecord(previousMatchValues) ? getDerivedTimeOutActive(previousMatchValues) : undefined;

    if (!isRecord(previousMatchValues) || wasTimeOutActive !== isTimeOutActive) {
        postFieldUpdate("isTimeOutActive", isTimeOutActive);
    }
}

async function listenToMatch(matchID, isInitialRun, addToListenerList, logLabel) {
    const matchRef = db.ref(`matches/${matchID}`);
    const match = await matchRef.get();
    const matchValues = match.val();

    if (!isRecord(matchValues)) {
        return;
    }

    console.log(logLabel, JSON.stringify({
        currentMatch: matchID,
        matchSettings: matchValues
    }, null, 2));

    postMatchFieldUpdates(matchValues);

    if (!isInitialRun) {
        return;
    }

    let previousMatchValues = cloneMatchValues(matchValues);

    for (const key of getFieldListenerKeys(matchValues)) {
        const fieldRef = db.ref(`matches/${matchID}/${key}`);

        fieldRef.on("value", (snapShot) => {
            const nextValue = snapShot.val();

            if (isRecord(nextValue) && Object.keys(nextValue).includes("cursor")) {
                console.log("OpenScoreboard ignored cursor field update", key);
                return;
            }

            if (nextValue === null) {
                return;
            }

            if (valuesMatch(previousMatchValues[key], nextValue)) {
                return;
            }

            const nextMatchValues = {
                ...previousMatchValues,
                [key]: cloneMatchValues(nextValue),
            };

            postFieldUpdate(key, nextValue);

            if (key === "isATimeOutActive" || key === "isBTimeOutActive") {
                postDerivedFieldUpdates(nextMatchValues, previousMatchValues);
            }

            previousMatchValues = nextMatchValues;
        });

        addToListenerList(() => { fieldRef.off("value"); });
    }
}

export const updateCurrentMatch = async (currentMatchSnap,isInitialRun, resetListeners: {():void}, addToListenerList ) => {
    //console.log(resetListeners)
    resetListeners();
    const rawCurrentMatch = currentMatchSnap.val();
    console.log("OpenScoreboard raw current match", rawCurrentMatch);
    let currentMatch = unwrapCursorValue(rawCurrentMatch);
    console.log("OpenScoreboard resolved current match", currentMatch);
    //console.log(currentMatch)
    if (typeof currentMatch === "string" && currentMatch.length > 0) {
        await listenToMatch(currentMatch, true, addToListenerList, "OpenScoreboard current match settings");
    }
};

export const updateTeamMatch = async (currentMatchSnap,isInitialRun, resetListeners, addToListenerList ) => {
    // Resolve from Snapshot to values
    const rawCurrentMatch = currentMatchSnap.val();
    console.log("OpenScoreboard raw team current match", rawCurrentMatch);
    let currentMatch = unwrapCursorValue(rawCurrentMatch);
    console.log("OpenScoreboard resolved team current match", currentMatch);

    let matchFieldListenerRemovalList = [];
    // console.log(currentMatch, typeof currentMatch === "string", currentMatch.length);
    if (typeof currentMatch === "string" && currentMatch.length > 0) {
        await listenToMatch(currentMatch, isInitialRun, addToListenerList, "OpenScoreboard team match settings");
    }
    return matchFieldListenerRemovalList;
};
export const updateTeamAID = async (TeamASnap,isInitialRun, resetListeners, addToListenerList ) => {
    let teamAID = TeamASnap.val();
    console.log(teamAID);
    if (typeof teamAID === "string") {
        if (isInitialRun) {
            let teamRef = db.ref(`teams/${teamAID}/teamName`);
            teamRef.on("value", (teamNameSnap) => {
                let teamName = teamNameSnap.val();
                if (typeof teamName === "string") {
                    postFieldUpdate("teamAName", teamNameSnap.val());
                    //window.postMessage({ teamAName: teamNameSnap.val() });
                }
            });
            addToListenerList(() => { teamRef.off("value"); });
            let teamLogoRef = db.ref(`teams/${teamAID}/teamLogoURL`);
            teamLogoRef.on("value", (teamLogoSnap) => {
                let teamLogo = teamLogoSnap.val();
                if (typeof teamLogo === "string") {
                    postFieldUpdate("teamLogoURLA", teamLogoSnap.val());
                    //window.postMessage({ teamLogoURLA:  });
                }
            });
            addToListenerList(() => { teamLogoRef.off("value"); });
        }
        else {
            let teamNameSnap = await db.ref(`teams/${teamAID}/teamName`).get();
            let teamName = teamNameSnap.val();
            if (typeof teamName === "string") {
                postFieldUpdate("teamAName", teamNameSnap.val());
                //window.postMessage({ teamAName: teamNameSnap.val() });
            }
            let teamLogoSnap = await db.ref(`teams/${teamAID}/teamLogoURL`).get();
            let teamLogo = teamLogoSnap.val();
            if (typeof teamLogo === "string") {
                postFieldUpdate("teamLogoURLA", teamLogoSnap.val());
              //  window.postMessage({  });
            }

        }


    }
};

export const updateTeamBID = async (TeamBSnap,isInitialRun, resetListeners, addToListenerList ) => {
    let teamBID = TeamBSnap.val();
    console.log(teamBID);
    if (typeof teamBID === "string") {
        if (isInitialRun) {
            let teamRef = db.ref(`teams/${teamBID}/teamName`);
            teamRef.on("value", (teamNameSnap) => {
                let teamName = teamNameSnap.val();
                if (typeof teamName === "string") {
                    postFieldUpdate("teamBName", teamNameSnap.val());
                }
            });
            addToListenerList(() => { teamRef.off("value"); });
            let teamLogoRef = db.ref(`teams/${teamBID}/teamLogoURL`);
            teamLogoRef.on("value", (teamLogoSnap) => {
                let teamLogo = teamLogoSnap.val();
                if (typeof teamLogo === "string") {
                    postFieldUpdate("teamLogoURLB", teamLogoSnap.val());
                }
            });
            addToListenerList(() => { teamLogoRef.off("value"); });
        }
        else {
            let teamNameSnap = await db.ref(`teams/${teamBID}/teamName`).get();
            let teamName = teamNameSnap.val();
            if (typeof teamName === "string") {
                postFieldUpdate("teamBName", teamNameSnap.val());
            }

            let teamLogoSnap = await db.ref(`teams/${teamBID}/teamLogoURL`).get();
            let teamLogo = teamLogoSnap.val();
            if (typeof teamLogo === "string") {
                postFieldUpdate("teamLogoURLB", teamLogoSnap.val());
            }
        }


    }
};

export const updateTeamAScore = async (TeamASnap) => {
    let teamAScore = TeamASnap.val();
    console.log(teamAScore);
    if (typeof teamAScore === "string" || typeof teamAScore === "number") {
        postFieldUpdate("teamAScore", TeamASnap.val());

    }
};

export const updateTeamBScore = async (TeamBSnap) => {
    let teamBScore = TeamBSnap.val();
    console.log(teamBScore);
    if (typeof teamBScore === "string" || typeof teamBScore === "number") {
        postFieldUpdate("teamBScore", TeamBSnap.val());

    }

};
export const updateTeamALogoURL = async (TeamASnap) => {
    let teamAScore = TeamASnap.val();
    console.log(teamAScore);
    if (typeof teamAScore === "string") {
        postFieldUpdate("teamLogoURLA", TeamASnap.val());

    }
};

export const updateTeamBLogoURL = async (TeamBSnap) => {
    let teamBScore = TeamBSnap.val();
    console.log(teamBScore);
    if (typeof teamBScore === "string") {
        postFieldUpdate("teamLogoURLB", TeamBSnap.val());

    }

};
