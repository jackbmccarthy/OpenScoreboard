export function getNewPlayer() {
    return {
        firstName: "",
        lastName: "",
        imageURL: "",
        country: "",
        jerseyColor: "",
        clubName: "",
        firstNameInitial: false,
        lastNameInitial: false,
        isImported: false

    }
}

export function newImportedPlayer(firstName: string, lastName: string, imageURL: string, country = "", jerseyColor = "") {
    return {
        firstName: firstName,
        lastName: lastName,
        imageURL: imageURL,
        country: country,
        clubName: "",
        jerseyColor: jerseyColor,
        firstNameInitial: false,
        lastNameInitial: false,
        isImported: false
    }
}
