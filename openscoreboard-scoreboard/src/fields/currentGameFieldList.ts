import { getCurrentGameScore, getMatchScore } from "../match";
import { getCombinedPlayersFormatted } from "../players";

const timeoutTimerIntervals = new WeakMap<HTMLElement, number>();
const TIMEOUT_DURATION_SECONDS = 60;

function formatTimeoutTimer(startTime: string) {
    const startTimeMs = Date.parse(startTime);
    if (Number.isNaN(startTimeMs)) {
        return "0";
    }

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
    const remainingSeconds = Math.max(0, TIMEOUT_DURATION_SECONDS - elapsedSeconds);

    return remainingSeconds.toString();
}

function clearTimeoutTimer(matchNode: HTMLElement, displayValue = "0") {
    const existingInterval = timeoutTimerIntervals.get(matchNode);
    if (typeof existingInterval !== "undefined") {
        window.clearInterval(existingInterval);
        timeoutTimerIntervals.delete(matchNode);
    }

    matchNode.innerText = displayValue;
}

function updateTimeoutTimer(matchNode: HTMLElement, startTime: string, isActive: boolean) {
    clearTimeoutTimer(matchNode);

    if (!isActive || typeof startTime !== "string" || startTime.length === 0 || Number.isNaN(Date.parse(startTime))) {
        return;
    }

    const renderTimer = () => {
        matchNode.innerText = formatTimeoutTimer(startTime);
    };

    renderTimer();
    const interval = window.setInterval(() => {
        if (!matchNode.isConnected) {
            window.clearInterval(interval);
            timeoutTimerIntervals.delete(matchNode);
            return;
        }

        renderTimer();
    }, 1000);
    timeoutTimerIntervals.set(matchNode, interval);
}

function updateCombinedTimeoutTimer(matchNode: HTMLElement, currentMatchSettings) {
    if (currentMatchSettings.isATimeOutActive === true) {
        updateTimeoutTimer(matchNode, currentMatchSettings.timeOutStartTimeA, true);
        return;
    }

    if (currentMatchSettings.isBTimeOutActive === true) {
        updateTimeoutTimer(matchNode, currentMatchSettings.timeOutStartTimeB, true);
        return;
    }

    updateTimeoutTimer(matchNode, "", false);
}


export const currentGameFieldList = [
    {
        field: "currentAGameScore",
        label: "A Game Score",
        category: "Current Game",
        sample: "0",
        justify: "center",
        requiredFields: ["isGame1Finished",
            "isGame2Finished",
            "isGame3Finished",
            "isGame4Finished",
            "isGame5Finished",
            "isGame6Finished",
            "isGame7Finished",
            "isGame8Finished",
            "isGame9Finished",
            "isGame1Started",
            "isGame2Started",
            "isGame3Started",
            "isGame4Started",
            "isGame5Started",
            "isGame6Started",
            "isGame7Started",
            "isGame8Started",
            "isGame9Started",
            "game1AScore",
            "game2AScore",
            "game3AScore",
            "game4AScore",
            "game5AScore",
            "game6AScore",
            "game7AScore",
            "game8AScore",
            "game9AScore",
            "game1BScore",
            "game2BScore",
            "game3BScore",
            "game4BScore",
            "game5BScore",
            "game6BScore",
            "game7BScore",
            "game8BScore",
            "game9BScore",

        ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getCurrentGameScore(currentMatchSettings)?.a || 0;

        }
    },
    {
        field: "currentBGameScore",
        label: "B Game Score",
        category: "Current Game",
        sample: "0",
        justify: "center",
        requiredFields: ["isGame1Finished",
            "isGame2Finished",
            "isGame3Finished",
            "isGame4Finished",
            "isGame5Finished",
            "isGame6Finished",
            "isGame7Finished",
            "isGame8Finished",
            "isGame9Finished",
            "isGame1Started",
            "isGame2Started",
            "isGame3Started",
            "isGame4Started",
            "isGame5Started",
            "isGame6Started",
            "isGame7Started",
            "isGame8Started",
            "isGame9Started",
            "game1AScore",
            "game2AScore",
            "game3AScore",
            "game4AScore",
            "game5AScore",
            "game6AScore",
            "game7AScore",
            "game8AScore",
            "game9AScore",
            "game1BScore",
            "game2BScore",
            "game3BScore",
            "game4BScore",
            "game5BScore",
            "game6BScore",
            "game7BScore",
            "game8BScore",
            "game9BScore",

        ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getCurrentGameScore(currentMatchSettings)?.b || 0;

        }
    },
    {
        field: "currentAMatchScore",
        label: "A Match Score",
        category: "Current Game",
        sample: "0",
        justify: "center",
        requiredFields: ["isGame1Finished",
            "isGame2Finished",
            "isGame3Finished",
            "isGame4Finished",
            "isGame5Finished",
            "isGame6Finished",
            "isGame7Finished",
            "isGame8Finished",
            "isGame9Finished",
            "game1AScore",
            "game2AScore",
            "game3AScore",
            "game4AScore",
            "game5AScore",
            "game6AScore",
            "game7AScore",
            "game8AScore",
            "game9AScore",
            "game1BScore",
            "game2BScore",
            "game3BScore",
            "game4BScore",
            "game5BScore",
            "game6BScore",
            "game7BScore",
            "game8BScore",
            "game9BScore",

        ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getMatchScore(currentMatchSettings).a || 0;
        }
    },
    {
        field: "currentBMatchScore",
        label: "B Match Score",
        category: "Current Game",
        sample: "0",
        justify: "center",
        requiredFields: ["isGame1Finished",
            "isGame2Finished",
            "isGame3Finished",
            "isGame4Finished",
            "isGame5Finished",
            "isGame6Finished",
            "isGame7Finished",
            "isGame8Finished",
            "isGame9Finished",
            "game1AScore",
            "game2AScore",
            "game3AScore",
            "game4AScore",
            "game5AScore",
            "game6AScore",
            "game7AScore",
            "game8AScore",
            "game9AScore",
            "game1BScore",
            "game2BScore",
            "game3BScore",
            "game4BScore",
            "game5BScore",
            "game6BScore",
            "game7BScore",
            "game8BScore",
            "game9BScore",

        ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getMatchScore(currentMatchSettings).b || 0;

        }
    },
    {
        field: "timeOutTimerA",
        label: "Time Out Timer A",
        category: "Time Outs",
        sample: "60",
        justify: "center",
        requiredFields: ["timeOutStartTimeA", "isATimeOutActive"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            updateTimeoutTimer(matchNode, currentMatchSettings.timeOutStartTimeA, currentMatchSettings.isATimeOutActive);
        }
    },
    {
        field: "timeOutTimerB",
        label: "Time Out Timer B",
        category: "Time Outs",
        sample: "60",
        justify: "center",
        requiredFields: ["timeOutStartTimeB", "isBTimeOutActive"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            updateTimeoutTimer(matchNode, currentMatchSettings.timeOutStartTimeB, currentMatchSettings.isBTimeOutActive);
        }
    },
    {
        field: "timeOutTimer",
        label: "Time Out Timer",
        category: "Time Outs",
        sample: "60",
        justify: "center",
        requiredFields: ["timeOutStartTimeA", "timeOutStartTimeB", "isATimeOutActive", "isBTimeOutActive"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            updateCombinedTimeoutTimer(matchNode, currentMatchSettings);
        }
    },
    //combinedAName
    {
        field: "combinedAName",
        label: "Combined A Name",
        category: "Player Names",
        sample: "Combined Player A",
        justify: "flex-start",
        requiredFields: ["playerA", "playerA2"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            //console.log("combined A", value, currentMatchSettings)
            matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2);
            //console.log("combinedName", document.getElementsByClassName("jerseyColorA"));
            Array.from(document.getElementsByClassName("jerseyColorA") as HTMLCollectionOf<HTMLElement>).forEach((jerseyAEl) => {
                //  //console.log("updating from combinedA")
                jerseyAEl.style.backgroundColor = currentMatchSettings["playerA"].jerseyColor || "transparent";
            });

            Array.from(document.getElementsByClassName("countryA") as HTMLCollectionOf<HTMLElement>).forEach((countryAEl) => {
                ////console.log("updating from combinedB")
                const countryAFlag = `flags/${currentMatchSettings["playerA"].country.toLowerCase()}.png`;
                if (currentMatchSettings["playerA"].country?.length > 0) {
                    countryAEl.style.height = "100%";
                    countryAEl.src = countryAFlag;
                }
                else {
                    countryAEl.style.height = "0px";
                }
                ;
            });
            Array.from(document.getElementsByClassName("imageURLA") as HTMLCollectionOf<HTMLElement>).forEach((imageAEl) => {
                ////console.log("updating from combinedB")
                const AImage = currentMatchSettings["playerA"].imageURL;
                if (AImage && AImage.length > 0) {
                    imageAEl.style.height = "100%";
                    imageAEl.src = AImage;
                }
                else {
                    imageAEl.style.height = "0px";
                }

            });
        }
    },
    {
        field: "combinedBName",
        label: "Combined B Name",
        category: "Player Names",
        sample: "Combined Player B",
        justify: "flex-start",
        requiredFields: ["playerB", "playerB2"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);
            Array.from(document.getElementsByClassName("jerseyColorB") as HTMLCollectionOf<HTMLElement>).forEach((jerseyBEl) => {
                //  //console.log("updating from combinedB")
                jerseyBEl.style.backgroundColor = currentMatchSettings["playerB"].jerseyColor || "transparent";
            });

            Array.from(document.getElementsByClassName("countryB") as HTMLCollectionOf<HTMLElement>).forEach((countryBEl) => {

                const countryBFlag = `flags/${currentMatchSettings["playerB"].country.toLowerCase()}.png`;
                if (currentMatchSettings["playerB"].country?.length > 0) {
                    countryBEl.style.height = "100%";
                    countryBEl.src = countryBFlag;
                }
                else {
                    countryBEl.style.height = "0px";
                }
            });

            Array.from(document.getElementsByClassName("imageURLB") as HTMLCollectionOf<HTMLElement>).forEach((imageBEl) => {
                //console.log("updating from combinedB")
                const BImage = currentMatchSettings["playerB"].imageURL;
                if (BImage && BImage.length > 0) {
                    imageBEl.style.height = "100%";
                    imageBEl.src = BImage;
                }
                else {
                    imageBEl.style.height = "0px";
                }
            });
        }
    },
    {
        field: "isSecondServer",
        requiredFields: ["isACurrentlyServing", "isSecondServer"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            if (currentMatchSettings.isACurrentlyServing && currentMatchSettings.isSecondServer) { //A is serving and 2nd is active
                if (matchNode.getAttribute("isa") !== null) { // isA is set, then show it.
                    matchNode.style.opacity = "1";
                }
                else {
                    matchNode.style.opacity = "0";
                }
            }
            else if (!currentMatchSettings.isACurrentlyServing && currentMatchSettings.isSecondServer) { // A is not serving, and 2nd is active
                if (matchNode.getAttribute("isa") === null) { //Element does not have isa set. Which means it is b. Show B
                    matchNode.style.opacity = "1";
                }
                else {
                    matchNode.style.opacity = "0";
                }
            }
            else {
                if (matchNode.getAttribute("isa") !== null) {
                    matchNode.style.opacity = "0";
                }
                if (matchNode.getAttribute("isa") === null) {
                    matchNode.style.opacity = "0";
                }

            }
        }
    },
];
