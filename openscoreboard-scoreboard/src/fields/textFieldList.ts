import { updateInnerText } from "./updateInnerText";
import { setPairedPlayerImageSources } from "./optionalImage";
import { setPairedCountryFlagSources } from "./countryFlag";

function createPlayerMetadataField(field, label, sample, playerField, metadataField) {
    return {
        field,
        label,
        category: "Player Details",
        sample,
        justify: "center",
        listenerFields: [playerField],
        requiredFields: [playerField],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            matchNode.innerText = `${currentMatchSettings?.[playerField]?.[metadataField] || ""}`;
        }
    };
}

const playerMetadataTextFields = [
    createPlayerMetadataField("genderA", "Player A Gender", "M", "playerA", "gender"),
    createPlayerMetadataField("genderB", "Player B Gender", "F", "playerB", "gender"),
    createPlayerMetadataField("genderA2", "Player A2 Gender", "M", "playerA2", "gender"),
    createPlayerMetadataField("genderB2", "Player B2 Gender", "F", "playerB2", "gender"),
    createPlayerMetadataField("ratingA", "Player A Rating", 2000, "playerA", "rating"),
    createPlayerMetadataField("ratingB", "Player B Rating", 1950, "playerB", "rating"),
    createPlayerMetadataField("ratingA2", "Player A2 Rating", 1850, "playerA2", "rating"),
    createPlayerMetadataField("ratingB2", "Player B2 Rating", 1800, "playerB2", "rating"),
    createPlayerMetadataField("rankingA", "Player A Ranking", 1, "playerA", "ranking"),
    createPlayerMetadataField("rankingB", "Player B Ranking", 2, "playerB", "ranking"),
    createPlayerMetadataField("rankingA2", "Player A2 Ranking", 3, "playerA2", "ranking"),
    createPlayerMetadataField("rankingB2", "Player B2 Ranking", 4, "playerB2", "ranking"),
];

export const textFieldList = [
    {
        field: "playerA",
        label: "Player A",
        category: "Player Names",
        sample: "Player A",
        justify: "flex-start",
        listenerFields: ["playerA", "playerB"],
        requiredFields: ["playerA", "playerB"],
        action: (matchNode: HTMLElement, _value, currentMatchSettings) => {
            const playerA = currentMatchSettings?.playerA || {};
            const playerB = currentMatchSettings?.playerB || {};
            matchNode.innerText = playerA.firstName || "";
            const jerseyAElements = document.getElementsByClassName("jerseyColorA");
            for (const jerseyAEl of jerseyAElements) {
                jerseyAEl.style.backgroundColor = playerA.jerseyColor || "transparent";
            }

            setPairedCountryFlagSources(document, playerA, playerB);
            setPairedPlayerImageSources(document, playerA, playerB);
        }
    },
    {
        field: "playerB",
        label: "Player B",
        category: "Player Names",
        sample: "Player B",
        justify: "flex-start",
        listenerFields: ["playerA", "playerB"],
        requiredFields: ["playerA", "playerB"],
        action: (matchNode: HTMLElement, _value, currentMatchSettings) => {
            const playerA = currentMatchSettings?.playerA || {};
            const playerB = currentMatchSettings?.playerB || {};
            matchNode.innerText = playerB.firstName || "";
            const jerseyBElements = document.getElementsByClassName("jerseyColorB") as HTMLCollectionOf<HTMLElement>;
            for (const jerseyBEl of jerseyBElements) {
                jerseyBEl.style.backgroundColor = playerB.jerseyColor || "transparent";
            }

            setPairedCountryFlagSources(document, playerA, playerB);
            setPairedPlayerImageSources(document, playerA, playerB);
        }
    },
    {
        field: "playerB2",
        label: "Player B2",
        category: "Player Names",
        sample: "Player B2",
        justify: "flex-start",
        action: (matchNode: HTMLElement, value) => {
            matchNode.innerText = value.firstName;
        }
    },
    {
        field: "playerA2",
        label: "Player A2",
        category: "Player Names",
        sample: "Player A2",
        justify: "flex-start",
        action: (matchNode: HTMLElement, value) => {
            matchNode.innerText = value.firstName;
        }
    },
    ...playerMetadataTextFields,
    {
        field: "game1AScore",
        label: "Player A G1 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game1BScore",
        label: "Player B G1 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game2AScore",
        label: "Player A G2 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game2BScore",
        label: "Player B G2 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game3AScore",
        label: "Player A G3 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game3BScore",
        label: "Player B G3 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game4AScore",
        label: "Player A G4 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game4BScore",
        label: "Player B G4 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game5AScore",
        label: "Player A G5 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game5BScore",
        label: "Player B G5 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game6AScore",
        label: "Player A G6 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game6BScore",
        label: "Player B G6 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game7AScore",
        label: "Player A G7 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game7BScore",
        label: "Player B G7 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },

    {
        field: "game8AScore",
        label: "Player A G8 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game8BScore",
        label: "Player B G8 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },

    {
        field: "game9AScore",
        label: "Player A G9 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "game9BScore",
        label: "Player B G9 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center",
        action: updateInnerText
    },
    {
        field: "eventName",
        label: "Event Name",
        category: "Match",
        sample: "Open Singles",
        justify: "center",
        action: updateInnerText
    },
    {
        field: "matchRound",
        label: "Round",
        category: "Match",
        sample: "Quarter Final",
        justify: "center",
        action: updateInnerText
    },
    {
        field: "teamAName",
        label: "Team A Name",
        category: "Teams",
        sample: "Team A",
        justify: "flex-start",
        action: updateInnerText
    },
    {
        field: "teamBName",
        label: "Team B Name",
        category: "Teams",
        sample: "Team B",
        justify: "flex-start",
        action: updateInnerText
    },
];
