type ImageFieldActionValue = {
    playerA?: { jerseyColor?: string }
    playerB?: { jerseyColor?: string }
}

type ImageFieldEntry = {
    field: string
    label: string
    category: string
    sample?: string
    action?: (matchNode: HTMLImageElement, value: string | ImageFieldActionValue) => void
}

export const imageFieldList: ImageFieldEntry[] = [
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
        action: (matchNode, value) => {
            if (typeof value !== "string") {
                matchNode.style.backgroundColor = value.playerA?.jerseyColor || "transparent";
            }

        }
    },
    {
        field: "imageURLB",
        label: "Player Image B",
        category: "Player Images",
        sample: "",
        action: (matchNode, value) => {
            if (typeof value !== "string") {
                matchNode.style.backgroundColor = value.playerB?.jerseyColor || "blue";
            }

        }
    },
    {
        field: "teamLogoURLA",
        label: "Team A Logo URL",
        category: "Teams",
        sample: "",
        action: (matchNode, value) => {
            if (typeof value === "string") {
                matchNode.src = value;
            }
        }
        // justify: "center"
    },
    {
        field: "teamLogoURLB",
        label: "Team B Logo URL",
        category: "Teams",
        sample: "",
        action: (matchNode, value) => {
            if (typeof value === "string") {
                matchNode.src = value;
            }
        }
        // justify: "center"
    },
];
