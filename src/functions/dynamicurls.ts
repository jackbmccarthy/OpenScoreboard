import db, { getUserPath } from "../../database";
import { getTableName, getTablePassword } from "./tables";
import { getTeamMatch } from "./teammatches";
import { getTeamName } from "./teams";

export async function getMyDynamicURLs(includeName = false) {
    let myURLsSnap = await db.ref(`users/${getUserPath()}/mydynamicurls`).get()
    let myURLs = myURLsSnap.val()
    if (myURLs) {
        if (includeName) {
            let entryList = Object.entries(myURLs)
            let additionalInfoPromises = await Promise.all(entryList.map(async (myDynURL) => {
                let newItem = { ...myDynURL[1] }

                const tableID = myDynURL[1].tableID
                const teamMatchID = myDynURL[1].teammatchID
                if (tableID && tableID.length > 0) {
                    newItem["tableName"] = await getTableName(myDynURL[1].tableID)
                    newItem["password"] = await getTablePassword(myDynURL[1].tableID)
                }
                else if (teamMatchID && teamMatchID.length > 0) {
                    let teamNames = await getTeamMatch(myDynURL[1].teammatchID)
                    newItem["teamAID"] = teamNames["teamAID"]
                    newItem["teamBID"] = teamNames["teamBID"]
                    newItem["teamMatchStartTime"] = teamNames["startTime"]
                    newItem["teamAName"] = await getTeamName(newItem["teamAID"])
                    newItem["teamBName"] = await getTeamName(newItem["teamBID"])
                }

                return [myDynURL[0], newItem]

            }))
            return additionalInfoPromises
        }
        return Object.entries(myURLs)
    }
    else {
        return []
    }
}

export async function createDynamicURL(dynamicURLName, tableID, teammatchID, tableNumber, scoreboardID) {
    let newDynamicURL = await db.ref(`dynamicurls`).push({
        dynamicURLName: dynamicURLName,
        tableID: tableID,
        teammatchID: teammatchID,
        tableNumber: tableNumber,
        owner: getUserPath(),
        scoreboardID: scoreboardID
    })
    db.ref(`users/${getUserPath()}/mydynamicurls`).push({
        id: newDynamicURL.key,
        dynamicURLName: dynamicURLName,
        tableID: tableID,
        teammatchID: teammatchID,
        tableNumber: tableNumber,
        scoreboardID: scoreboardID
    })

}
export async function updateDynamicURL(myDynamicURLID, dynamicURLName, tableID, teammatchID, tableNumber, scoreboardID) {
    let realDynamicURLIDSnap = await db.ref(`users/${getUserPath()}/mydynamicurls/${myDynamicURLID}/id`).get()
    let realDynamicID = realDynamicURLIDSnap.val()

    db.ref(`users/${getUserPath()}/mydynamicurls/${myDynamicURLID}`).set({
        id: realDynamicID,
        dynamicURLName: dynamicURLName,
        tableID: tableID,
        teammatchID: teammatchID,
        tableNumber: tableNumber,
        scoreboardID: scoreboardID
    })
    let newDynamicURL = await db.ref(`dynamicurls/${realDynamicID}`).set({
        dynamicURLName: dynamicURLName,
        tableID: tableID,
        teammatchID: teammatchID,
        tableNumber: tableNumber,
        owner: getUserPath(),
        scoreboardID: scoreboardID
    })
}

export async function deleteDynamicURL(myDynamicURLID) {
    let realDynamicURLIDSnap = await db.ref(`users/${getUserPath()}/mydynamicurls/${myDynamicURLID}/id`).get()
    let realDynamicID = realDynamicURLIDSnap.val()

    db.ref(`users/${getUserPath()}/mydynamicurls/${myDynamicURLID}`).remove()
    let newDynamicURL = await db.ref(`dynamicurls/${realDynamicID}`).remove()
}

export function openEmail(subject, body) {
    var link = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    window.location.href = link;
}