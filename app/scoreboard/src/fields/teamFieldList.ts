import { updateInnerText } from "./updateInnerText";

export const teamFieldList = [
    {
        field: "teamAScore",
        label: "Team A Score",
        category: "Teams",
        sample: "0",
        justify: "center",
        action: updateInnerText
    },
    {
        field: "teamBScore",
        label: "Team B Score",
        category: "Teams",
        sample: "0",
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
