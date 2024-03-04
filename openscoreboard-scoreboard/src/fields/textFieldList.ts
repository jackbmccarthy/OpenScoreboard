import { updateInnerText } from "./updateInnerText";


export const textFieldList = [
    {
        field: "playerA",
        label: "Player A",
        category: "Player Names",
        sample: "Player A",
        justify: "flex-start",
        action: (matchNode: HTMLElement, value) => {
            matchNode.innerText = value.firstName;
            const jerseyAElements = document.getElementsByClassName("jerseyColorA");
            for (const jerseyAEl of jerseyAElements) {
                jerseyAEl.style.backgroundColor = value.jerseyColor || "transparent";
            }

            Array.from(document.getElementsByClassName("countryA") as HTMLCollectionOf<HTMLElement>).forEach((countryAEl) => {
                const countryAFlag = `flags/${value.country.toLowerCase()}.png`;
                if (countryAFlag) {
                    countryAEl.style.height = "100%";
                    countryAEl.src = countryAFlag;
                }
                else {
                    countryAEl.style.height = "0px";
                }
            });
            Array.from(document.getElementsByClassName("imageURLA") as HTMLCollectionOf<HTMLElement>).forEach((imageAEl) => {
                const AImage = value.imageURL;
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
        field: "playerB",
        label: "Player B",
        category: "Player Names",
        sample: "Player B",
        justify: "flex-start",
        action: (matchNode: HTMLElement, value) => {
            matchNode.innerText = value.firstName;
            const jerseyBElements = document.getElementsByClassName("jerseyColorB") as HTMLCollectionOf<HTMLElement>;
            for (const jerseyBEl of jerseyBElements) {
                jerseyBEl.style.backgroundColor = value.jerseyColor || "transparent";
            }
            Array.from(document.getElementsByClassName("countryB") as HTMLCollectionOf<HTMLElement>).forEach((countryBEl) => {
                const countryBFlag = `flags/${value.country.toLowerCase()}.png`;
                if (value.country.length > 0) {
                    countryBEl.style.height = "100%";
                    countryBEl.src = countryBFlag;
                }
                else {
                    countryBEl.style.height = "0px";
                }

            });

            Array.from(document.getElementsByClassName("imageURLB") as HTMLCollectionOf<HTMLElement>).forEach((imageBEl) => {
                //console.log("ImageBEl", imageBEl)
                const BImage = value.imageURL;
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
