import { getCurrentGameScore, getMatchScore } from "../match";
import { setPairedPlayerImageSources } from "./optionalImage";
import { setPairedCountryFlagSources } from "./countryFlag";
import { getCombinedPlayersFormatted } from "../players";


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
    //combinedAName
    {
        field: "combinedAName",
        label: "Combined A Name",
        category: "Player Names",
        sample: "Combined Player A",
        justify: "flex-start",
        listenerFields: ["playerA", "playerA2", "playerB"],
        requiredFields: ["playerA", "playerA2", "playerB"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            //console.log("combined A", value, currentMatchSettings)
            matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2);
            //console.log("combinedName", document.getElementsByClassName("jerseyColorA"));
            Array.from(document.getElementsByClassName("jerseyColorA") as HTMLCollectionOf<HTMLElement>).forEach((jerseyAEl) => {
                //  //console.log("updating from combinedA")
                jerseyAEl.style.backgroundColor = currentMatchSettings["playerA"].jerseyColor || "transparent";
            });

            setPairedCountryFlagSources(document, currentMatchSettings.playerA, currentMatchSettings.playerB);
            setPairedPlayerImageSources(document, currentMatchSettings.playerA, currentMatchSettings.playerB);
        }
    },
    {
        field: "combinedBName",
        label: "Combined B Name",
        category: "Player Names",
        sample: "Combined Player B",
        justify: "flex-start",
        listenerFields: ["playerA", "playerB", "playerB2"],
        requiredFields: ["playerA", "playerB", "playerB2"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);
            Array.from(document.getElementsByClassName("jerseyColorB") as HTMLCollectionOf<HTMLElement>).forEach((jerseyBEl) => {
                //  //console.log("updating from combinedB")
                jerseyBEl.style.backgroundColor = currentMatchSettings["playerB"].jerseyColor || "transparent";
            });

            setPairedCountryFlagSources(document, currentMatchSettings.playerA, currentMatchSettings.playerB);
            setPairedPlayerImageSources(document, currentMatchSettings.playerA, currentMatchSettings.playerB);
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
