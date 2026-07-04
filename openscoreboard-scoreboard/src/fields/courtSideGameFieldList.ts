import { getCurrentGameScore, getMatchScore } from "../match";
import {
    getCombinedPlayersFormatted,
    getCombinedPlayersFormattedWithRating,
    PlayerNameFormat,
} from "../players";
import { isCourtSideServing, resolveCourtSide } from "./courtSide";

type CourtSide = "A" | "B";

function getCombinedCourtSideName(currentMatchSettings, courtSide: CourtSide, format: PlayerNameFormat = "partial", withRating = false) {
    const side = resolveCourtSide(courtSide, currentMatchSettings);
    const player = currentMatchSettings?.[`player${side}`];
    const doublesPlayer = currentMatchSettings?.[`player${side}2`];

    return withRating
        ? getCombinedPlayersFormattedWithRating(player, doublesPlayer, format)
        : getCombinedPlayersFormatted(player, doublesPlayer, format);
}

const courtSideNameRequiredFields = [
    "playerA",
    "playerA2",
    "playerB",
    "playerB2",
    "isCourtSideScoreboardFlipped",
    "isSwitched",
];

function createCourtSideCombinedNameField(field, label, sample, courtSide: CourtSide, format: PlayerNameFormat = "partial", withRating = false) {
    return {
        field,
        label,
        category: "Court Side",
        sample,
        justify: "flex-start",
        requiredFields: courtSideNameRequiredFields,
        action: (matchNode: HTMLElement, _value, currentMatchSettings) => {
            matchNode.innerText = getCombinedCourtSideName(currentMatchSettings, courtSide, format, withRating);
        }
    };
}

const courtSideCombinedNameFormatFields = [
    createCourtSideCombinedNameField("courtSideCombinedAFirstInitialLastName", "Court Side A First Initial + Last Name", "A Smith / C Brown", "A", "firstInitialLastName"),
    createCourtSideCombinedNameField("courtSideCombinedBFirstInitialLastName", "Court Side B First Initial + Last Name", "B Jones / D Wilson", "B", "firstInitialLastName"),
    createCourtSideCombinedNameField("courtSideCombinedAFirstNameLastInitial", "Court Side A First Name + Last Initial", "Alex S / Casey B", "A", "firstNameLastInitial"),
    createCourtSideCombinedNameField("courtSideCombinedBFirstNameLastInitial", "Court Side B First Name + Last Initial", "Blake J / Drew W", "B", "firstNameLastInitial"),
    createCourtSideCombinedNameField("courtSideCombinedANameWithRating", "Court Side A Name + Rating", "Smith (2000) / Brown (1850)", "A", "partial", true),
    createCourtSideCombinedNameField("courtSideCombinedBNameWithRating", "Court Side B Name + Rating", "Jones (1950) / Wilson (1800)", "B", "partial", true),
];

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
            const currentGameScore = getCurrentGameScore(currentMatchSettings);
            const scoreKey = resolveCourtSide("A", currentMatchSettings).toLowerCase();
            matchNode.innerText = currentGameScore?.[scoreKey] || 0;
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
            const currentGameScore = getCurrentGameScore(currentMatchSettings);
            const scoreKey = resolveCourtSide("B", currentMatchSettings).toLowerCase();
            matchNode.innerText = currentGameScore?.[scoreKey] || 0;
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
            const matchScore = getMatchScore(currentMatchSettings);
            const scoreKey = resolveCourtSide("A", currentMatchSettings).toLowerCase();
            matchNode.innerText = matchScore?.[scoreKey]?.toString() || "0";
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
            const matchScore = getMatchScore(currentMatchSettings);
            const scoreKey = resolveCourtSide("B", currentMatchSettings).toLowerCase();
            matchNode.innerText = matchScore?.[scoreKey]?.toString() || "0";
        }
    },
    //combinedAName
    {
        field: "courtSideCombinedAName",
        label: "Combined A Name",
        category: "Court Side",
        sample: "Combined Player A",
        justify: "flex-start",
        requiredFields: courtSideNameRequiredFields,
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getCombinedCourtSideName(currentMatchSettings, "A");
        }
    },
    {
        field: "courtSideCombinedBName",
        label: "Combined B Name",
        category: "Player Names",
        sample: "Combined Player B",
        justify: "flex-start",
        requiredFields: courtSideNameRequiredFields,
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = getCombinedCourtSideName(currentMatchSettings, "B");
        }
    },
    ...courtSideCombinedNameFormatFields,
    {
        field: "courtSideIsACurrentlyServing",
        label: "A Serving",
        category: "Court Side",
        sample: "",
        requiredFields: ["isCourtSideScoreboardFlipped","isSwitched","isACurrentlyServing" ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.style.opacity = isCourtSideServing("A", currentMatchSettings) ? "1" : "0";
        }
    },
    {
        field: "courtSideIsBCurrentlyServing",
        label: "B Serving",
        category: "Court Side",
        sample: "",
        requiredFields: ["isCourtSideScoreboardFlipped","isSwitched","isACurrentlyServing" ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.style.opacity = isCourtSideServing("B", currentMatchSettings) ? "1" : "0";
        }
    }
];
