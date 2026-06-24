function normalizeGender(value = "") {
    return `${value || ""}`.trim().slice(0, 1).toUpperCase();
}

function normalizeNumberField(value) {
    const parsedValue = parseInt(`${value || ""}`, 10);
    return Number.isNaN(parsedValue) ? "" : parsedValue;
}

export function getNewPlayer() {
    return {
        firstName: "",
        lastName: "",
        imageURL: "",
        country: "",
        gender: "",
        rating: "",
        ranking: "",
        jerseyColor: "",
        clubName: "",
        firstNameInitial: false,
        lastNameInitial: false,
        isImported: false

    }
}

export function newImportedPlayer(firstName, lastName, imageURL, country = "", jerseyColor = "", gender = "", rating = "", ranking = "") {
    return {
        firstName: firstName,
        lastName: lastName,
        imageURL: imageURL,
        country: country,
        gender: normalizeGender(gender),
        rating: normalizeNumberField(rating),
        ranking: normalizeNumberField(ranking),
        clubName: "",
        jerseyColor: jerseyColor,
        firstNameInitial: false,
        lastNameInitial: false,
        isImported: false
    }
}
