import { getCurrentGameScore, getMatchScore } from "../match";
import { setPairedPlayerImageSources } from "./optionalImage";
import { setPairedCountryFlagSources } from "./countryFlag";
import {
    getCombinedPlayersFormatted,
    getCombinedPlayersFormattedWithRating,
    PlayerNameFormat,
} from "../players";

function syncSideVisuals(currentMatchSettings, side: "A" | "B") {
    const playerA = currentMatchSettings?.playerA || {};
    const playerB = currentMatchSettings?.playerB || {};
    const jerseyClassName = side === "A" ? "jerseyColorA" : "jerseyColorB";
    const primaryPlayer = side === "A" ? playerA : playerB;

    Array.from(document.getElementsByClassName(jerseyClassName) as HTMLCollectionOf<HTMLElement>).forEach((jerseyEl) => {
        jerseyEl.style.backgroundColor = primaryPlayer.jerseyColor || "transparent";
    });

    setPairedCountryFlagSources(document, playerA, playerB);
    setPairedPlayerImageSources(document, playerA, playerB);
}

function createCombinedNameField(field, label, sample, side: "A" | "B", format: PlayerNameFormat = "partial", withRating = false) {
    const primaryPlayerField = side === "A" ? "playerA" : "playerB";
    const doublesPlayerField = side === "A" ? "playerA2" : "playerB2";
    const listenerFields = ["playerA", "playerA2", "playerB", "playerB2"];

    return {
        field,
        label,
        category: "Player Names",
        sample,
        justify: "flex-start",
        listenerFields,
        requiredFields: listenerFields,
        action: (matchNode: HTMLElement, _value, currentMatchSettings) => {
            matchNode.innerText = withRating
                ? getCombinedPlayersFormattedWithRating(currentMatchSettings?.[primaryPlayerField], currentMatchSettings?.[doublesPlayerField], format)
                : getCombinedPlayersFormatted(currentMatchSettings?.[primaryPlayerField], currentMatchSettings?.[doublesPlayerField], format);
            syncSideVisuals(currentMatchSettings, side);
        }
    };
}

const combinedNameFormatFields = [
    createCombinedNameField("combinedAFirstInitialLastName", "Combined A First Initial + Last Name", "A Smith / C Brown", "A", "firstInitialLastName"),
    createCombinedNameField("combinedBFirstInitialLastName", "Combined B First Initial + Last Name", "B Jones / D Wilson", "B", "firstInitialLastName"),
    createCombinedNameField("combinedAFirstNameLastInitial", "Combined A First Name + Last Initial", "Alex S / Casey B", "A", "firstNameLastInitial"),
    createCombinedNameField("combinedBFirstNameLastInitial", "Combined B First Name + Last Initial", "Blake J / Drew W", "B", "firstNameLastInitial"),
    createCombinedNameField("combinedANameWithRating", "Combined A Name + Rating", "Smith (2000) / Brown (1850)", "A", "partial", true),
    createCombinedNameField("combinedBNameWithRating", "Combined B Name + Rating", "Jones (1950) / Wilson (1800)", "B", "partial", true),
];


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
            syncSideVisuals(currentMatchSettings, "A");
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
            syncSideVisuals(currentMatchSettings, "B");
        }
    },
    ...combinedNameFormatFields,
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
