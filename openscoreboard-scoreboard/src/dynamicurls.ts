import db from "../database"


export async function getDynamicURLDetails(dynamicURLID) {
    let dynamicurlSnap = await db.ref(`dynamicurls/${dynamicURLID}`).get()
    let dynURL = dynamicurlSnap.val()
    if (dynURL) {
        return dynURL
    }
    else {
        return {}
    }
}

export async function dynamicURLListener(dynamicURLID, callback) {
    db.ref(`dynamicurls/${dynamicURLID}`).on("value", (dynamicurlSnap) => {
        let dynURL = dynamicurlSnap.val()
        callback(dynURL)
    })

    return () => { db.ref(`dynamicurls/${dynamicURLID}`).off() }
}
