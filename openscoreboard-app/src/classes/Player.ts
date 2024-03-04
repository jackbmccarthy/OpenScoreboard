export function getNewPlayer(){
    return {
        firstName: "",
        lastName: "",
        imageURL: "",
        country: "",
        jerseyColor: "",
        clubName:"",
        firstNameInitial:false,
        lastNameInitial:false,
        isImported:false

    }
}

export function newImportedPlayer(firstName, lastName, imageURL, country="", jerseyColor=""){
    return {
        firstName: firstName,
        lastName: lastName,
        imageURL: imageURL,
        country: country,
        clubName:"",
        jerseyColor: "",
        firstNameInitial:false,
        lastNameInitial:false,
        isImported:false
    }
}