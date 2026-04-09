import db from "@/lib/database"
import { subscribeToPathValue } from "@/lib/realtime"

export type DynamicURLDetails = Record<string, unknown>

export async function getDynamicURLDetails(dynamicURLID: string): Promise<DynamicURLDetails> {
    let dynamicurlSnap = await db.ref(`dynamicurls/${dynamicURLID}`).get()
    let dynURL = dynamicurlSnap.val()
    if (dynURL) {
        return dynURL
    }
    else {
        return {}
    }
}

export async function dynamicURLListener(dynamicURLID: string, callback: (details: DynamicURLDetails) => void) {
    return subscribeToPathValue(`dynamicurls/${dynamicURLID}`, (dynamicURLValue) => {
        callback((dynamicURLValue || {}) as DynamicURLDetails)
    })
}
