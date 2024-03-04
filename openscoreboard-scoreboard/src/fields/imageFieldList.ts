export const imageFieldList = [
    {
        field: "countryA",
        label: "Country Flag A",
        category: "Flags",
    },
    {
        field: "countryB",
        label: "Country Flag B",
        category: "Flags",
    },
    {
        field: "imageURLA",
        label: "Player Image A",
        category: "Player Images",
        sample: "0",
        action: (matchNode: HTMLElement, value) => {
            matchNode.style.backgroundColor = value["playerA"].jerseyColor || "transparent";

        }
    },
    {
        field: "imageURLB",
        label: "Player Image B",
        category: "Player Images",
        sample: "",
        action: (matchNode: HTMLElement, value) => {
            matchNode.style.backgroundColor = value["playerB"].jerseyColor || "blue";

        }
    },
    {
        field: "teamLogoURLA",
        label: "Team A Logo URL",
        category: "Teams",
        sample: "",
        action: (matchNode: HTMLElement, value) => {
            matchNode.src = value;
        }
        // justify: "center"
    },
    {
        field: "teamLogoURLB",
        label: "Team B Logo URL",
        category: "Teams",
        sample: "",
        action: (matchNode: HTMLElement, value) => {
            matchNode.src = value;
        }
        // justify: "center"
    },
];
