export const conditionalShowFieldList = [
    {
        field: "isACurrentlyServing",
        action: (matchNode: HTMLElement, value) => {
            //console.log("action called","isACurrentlyServing", matchNode)
            if (value === true) {
                if (matchNode.getAttribute("isa") !== null) {
                    matchNode.style.opacity = "1";
                }
                else if (matchNode.getAttribute("isa") === null) {
                    matchNode.style.opacity = "0";
                }

            }
            else {
                if (matchNode.getAttribute("isa") !== null) {
                    matchNode.style.opacity = "0";
                }
                else if (matchNode.getAttribute("isa") === null) {
                    matchNode.style.opacity = "1";
                }
            }
        }
    },

    {
        field: "isGamePoint",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    },
    {
        field: "isMatchPoint",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    },
    {
        field: "isAYellowCarded",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    }, {
        field: "isBYellowCarded",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    }, {
        field: "isARedCarded",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    }, {
        field: "isBRedCarded",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    },
    {
        field: "isATimeOutActive",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    },
    {
        field: "isBTimeOutActive",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.opacity = "1";

            }
            else {
                matchNode.style.opacity = "0";
            }
        }
    },
    {
        field: "isGame1Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame2Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame3Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame4Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame5Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame6Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame7Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame8Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
    {
        field: "isGame9Started",
        action: (matchNode: HTMLElement, value) => {
            if (value === true) {
                matchNode.style.display = "flex";
            }
            else {
                matchNode.style.display = "none";
            }
        }
    },
];
