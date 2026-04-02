import { getCurrentGameScore, getMatchScore } from "../match";
import { getCombinedPlayersFormatted } from "../players";

export const courtSideGameFieldList = [
    {
        field: "courtSideAGameScore",
        label: "A Game Score",
        category: "Court Side",
        sample: "0",
        justify: "center",
        requiredFields:[ "isInBetweenGames",
            "isCourtSideScoreboardFlipped","isSwitched",
            "isGame1Finished",
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
            const courtSideAScores = getCurrentGameScore(currentMatchSettings);
            if (currentMatchSettings.isSwitched) {
                matchNode.innerText = (currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAScores?.a : courtSideAScores?.b) || 0;

            }
            else {
                matchNode.innerText = (!currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAScores?.a : courtSideAScores?.b) || 0;

            }
        }
    },
    {
        field: "courtSideBGameScore",
        label: "B Game Score",
        category: "Court Side",
        sample: "0",
        justify: "center",
        requiredFields:[ 
            "isInBetweenGames",
            "isCourtSideScoreboardFlipped","isSwitched",
            "isGame1Finished",
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
            const courtSideBScores = getCurrentGameScore(currentMatchSettings);
            if (currentMatchSettings.isSwitched) {
                matchNode.innerText = (!currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBScores?.a : courtSideBScores?.b) || 0;

            }
            else {
                matchNode.innerText = (currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBScores?.a : courtSideBScores?.b) || 0;

            }
        }
    },
    {
        field: "courtSideAMatchScore",
        label: "A Match Score",
        category: "Court Side",
        sample: "0",
        justify: "center",
        requiredFields:[ 
            "isInBetweenGames",
            "isCourtSideScoreboardFlipped","isSwitched",
            "isGame1Finished",
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
            const courtSideAMatchScore = getMatchScore(currentMatchSettings);
            if (currentMatchSettings.isSwitched) {
                matchNode.innerText = !currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAMatchScore.b?.toString() : courtSideAMatchScore.a?.toString() || "0";
            }
            else {
                matchNode.innerText = currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAMatchScore.b?.toString() : courtSideAMatchScore.a?.toString() || "0";

            }
        }
    },
    {
        field: "courtSideBMatchScore",
        label: "B Match Score",
        category: "Court Side",
        sample: "0",
        justify: "center",
        requiredFields:[ 
            "isInBetweenGames",
            "isCourtSideScoreboardFlipped","isSwitched",
            "isGame1Finished",
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
            const courtSideBMatchScore = getMatchScore(currentMatchSettings);
            if (currentMatchSettings.isSwitched) {
                matchNode.innerText = currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBMatchScore.b?.toString() : courtSideBMatchScore.a?.toString() || "0";
            }
            else {
                matchNode.innerText = !currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBMatchScore.b?.toString() : courtSideBMatchScore.a?.toString() || "0";

            }
        }
    },
    //combinedAName
    {
        field: "courtSideCombinedAName",
        label: "Combined A Name",
        category: "Court Side",
        sample: "Combined Player A",
        justify: "flex-start",
        requiredFields: ["playerA", "playerA2", "playerB","playerB2","isCourtSideScoreboardFlipped","isSwitched"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            if (currentMatchSettings.isSwitched) {
                currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
                    :
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);


            }
            else {
                !currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
                    :
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);

            }
        }
    },
    {
        field: "courtSideCombinedBName",
        label: "Combined B Name",
        category: "Player Names",
        sample: "Combined Player B",
        justify: "flex-start",
        requiredFields: ["playerA", "playerA2", "playerB","playerB2","isCourtSideScoreboardFlipped","isSwitched"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            if (currentMatchSettings.isSwitched) {
                !currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
                    :
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);


            }
            else {
                currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
                    :
                    matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);

            }
        }
    },
    {
        field: "courtSideIsACurrentlyServing",
        label: "A Serving",
        category: "Court Side",
        sample: "",
        requiredFields: ["isCourtSideScoreboardFlipped","isSwitched","isACurrentlyServing" ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            if (currentMatchSettings.isSwitched) {
                !currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "0" : "1"
                    :
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "1" : "0";

            }
            else {
                currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "0" : "1"
                    :
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "1" : "0";
            }
        }
    },
    {
        field: "courtSideIsBCurrentlyServing",
        label: "B Serving",
        category: "Court Side",
        sample: "",
        requiredFields: ["isCourtSideScoreboardFlipped","isSwitched","isACurrentlyServing" ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            if (currentMatchSettings.isSwitched) {
                !currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "1" : "0"
                    :
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "0" : "1";

            }
            else {
                currentMatchSettings.isCourtSideScoreboardFlipped ?
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "1" : "0"
                    :
                    matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? "0" : "1";

            }
        }
    }
];
