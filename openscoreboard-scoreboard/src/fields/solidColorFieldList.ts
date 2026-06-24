export const solidColorFieldList = [
    {
        field: "jerseyColorA",
        label: "Jersey Color A",
        category: "Jersey Color",
        sample: "red",
        action: (matchNode: HTMLElement, value) => {
            matchNode.style.backgroundColor = value || "transparent";
        },
    },
    {
        field: "jerseyColorB",
        label: "Jersey Color B",
        category: "Jersey Color",
        sample: "blue",
        action: (matchNode: HTMLElement, value) => {
            matchNode.style.backgroundColor = value || "transparent";
        },
    },
    {
        field: "teamJerseyColorA",
        label: "Team A Jersey Color",
        category: "Jersey Color",
        sample: "#0055FF",
        action: (matchNode: HTMLElement, value) => {
            matchNode.style.backgroundColor = value || "transparent";
        },
    },
    {
        field: "teamJerseyColorB",
        label: "Team B Jersey Color",
        category: "Jersey Color",
        sample: "#D62828",
        action: (matchNode: HTMLElement, value) => {
            matchNode.style.backgroundColor = value || "transparent";
        },
    },
];
