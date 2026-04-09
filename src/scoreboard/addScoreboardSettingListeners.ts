import db from "@/lib/database"

type ScoreboardContextMessage = Record<string, unknown>

export async function getScoreboardSettings(scoreboardID: string | null) {
    let settings = await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/showDuringActiveMatch`).get(),
        db.ref(`scoreboards/${scoreboardID}/showDuringTimeOuts`).get(),
        db.ref(`scoreboards/${scoreboardID}/alwaysShow`).get(),
        db.ref(`scoreboards/${scoreboardID}/showInBetweenGames`).get(),
    ])
    setShowDuringActiveMatch(scoreboardID, settings[0].val())
    setShowDuringTimeOuts(scoreboardID, settings[1].val())
    setAlwaysShow(scoreboardID, settings[2].val())
    setShowInBetweenGames(scoreboardID, settings[3].val())

}

function isRelevantToScoreboardSetting(eventData: unknown) {
    if (eventData && typeof eventData === "object") {
        const isReleventList = Object.keys(eventData).filter((keyName) => {
            return ["isInBetweenGames", "isATimeOutActive", "isBTimeOutActive", "isMatchStarted"].includes(keyName)
        })
        return isReleventList.length > 0 ? true : false
    }
}

function animateScoreboardFadeAway(rootNode: HTMLElement) {

    var fadeOutEffect = setInterval(function () {
        if (!rootNode.style.opacity) {
            rootNode.style.opacity = "1";
        }
        const currentOpacity = Number(rootNode.style.opacity || "0")
        if (currentOpacity > 0) {
            rootNode.style.opacity = String(currentOpacity - 0.033);
        } else {
            rootNode.style.opacity = "0";
            clearInterval(fadeOutEffect);
        }
    }, 1000 / 30);
}

function animateScoreboardFadeIn(rootNode: HTMLElement) {
    let opacity = 0
    var fadeInEffect = setInterval(function () {
        const currentOpacity = Number(rootNode.style.opacity || "0")
        if (!rootNode.style.opacity || currentOpacity < 1) {
            opacity += 0.033
            rootNode.style.opacity = String(opacity)
        } else {
            rootNode.style.opacity = "1";
            clearInterval(fadeInEffect);
        }
    }, 1000 / 30);
}



export function addScoreboardSettingListeners(scoreboardID: string | null, rootNode: HTMLElement | null) {
    let currentContext: ScoreboardContextMessage = {}
    const handleMessage = (event: MessageEvent<ScoreboardContextMessage>) => {
        currentContext = { ...currentContext, ...event.data }
        //console.log(event.data, currentContext)
        if (!rootNode) {
            return
        }
        if (!getAlwaysShow(scoreboardID)) {
            if (isRelevantToScoreboardSetting(event.data)) {
                if (getShowInBetweenGames(scoreboardID) && typeof event.data["isInBetweenGames"] !== "undefined") {
                    if (event.data["isInBetweenGames"]) {
                        animateScoreboardFadeIn(rootNode)
                    }
                    else {
                        animateScoreboardFadeAway(rootNode)
                    }
                }

                // if(typeof event.data["isATimeOutActive"] !=="undefined" || typeof event.data["isBTimeOutActive"] !=="undefined"){

                // }
                if (getShowDuringActiveMatch(scoreboardID) && (typeof event.data["isMatchStarted"] !== "undefined" || typeof event.data["isInBetweenGames"] !== "undefined")) {
                    if (typeof currentContext["isMatchStarted"] !== 'undefined' && typeof !currentContext["isInBetweenGames"] !== "undefined") {
                        if (currentContext["isMatchStarted"] && !currentContext["isInBetweenGames"]) {
                            animateScoreboardFadeIn(rootNode)
                        }
                        else {
                            animateScoreboardFadeAway(rootNode)
                        }
                    }

                }

            }
        }

    }

    window.addEventListener("message", handleMessage)

    return () => {
        window.removeEventListener("message", handleMessage)
    }
}

function getShowDuringActiveMatch(scoreboardID: string | null) {
    return localStorage.getItem(scoreboardID + "_showDuringActiveMatch") === "true" ? true : false
}

function getShowInBetweenGames(scoreboardID: string | null) {
    return localStorage.getItem(scoreboardID + "_showInBetweenGames") === "true" ? true : false
}

function getShowDuringTimeOuts(scoreboardID: string | null) {
    return localStorage.getItem(scoreboardID + "_showDuringTimeOuts") === "true" ? true : false
}

function getAlwaysShow(scoreboardID: string | null) {
    return localStorage.getItem(scoreboardID + "_alwaysShow") === "true" ? true : false
}

function setShowDuringActiveMatch(scoreboardID: string | null, value: unknown) {
    localStorage.setItem(scoreboardID + "_showDuringActiveMatch", value ? "true" : "false")
}

function setShowInBetweenGames(scoreboardID: string | null, value: unknown) {
    localStorage.setItem(scoreboardID + "_showInBetweenGames", value ? "true" : "false")
}

function setShowDuringTimeOuts(scoreboardID: string | null, value: unknown) {
    localStorage.setItem(scoreboardID + "_showDuringTimeOuts", value ? "true" : "false")
}

function setAlwaysShow(scoreboardID: string | null, value: unknown) {
    localStorage.setItem(scoreboardID + "_alwaysShow", value ? "true" : "false")
}
