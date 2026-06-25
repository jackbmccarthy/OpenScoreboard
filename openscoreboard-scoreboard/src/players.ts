export type PlayerNameFormat = "partial" | "full" | "firstInitialLastName" | "firstNameLastInitial";

function normalizeNamePart(value) {
    return `${value || ""}`.trim();
}

function isFullNameEntered(player:Player){
    if( player && normalizeNamePart(player.firstName).length > 0 && normalizeNamePart(player.lastName).length > 0){
        return true;
    }
    else{
        return false;
    }
}

function isPartialNameEntered(player:Player){
    if(player && (normalizeNamePart(player.firstName).length > 0 || normalizeNamePart(player.lastName).length > 0)){
        return true;
    }
    else{
        return false;
    }
}

function getPlayerPartialName(player:Player){
    if( player && normalizeNamePart(player.lastName).length >0){
        return normalizeNamePart(player.lastName);
    }
    
    else if(player && normalizeNamePart(player.firstName).length >0){
        return normalizeNamePart(player.firstName);
    }
    else{
        return "";
    }
}

function getPlayerFullName(player:Player){
    let firstName = player && player.firstNameInitial === true ? normalizeNamePart(player.firstName)[0] : normalizeNamePart(player?.firstName);
    let lastName = player && player.lastNameInitial === true ? normalizeNamePart(player.lastName)[0] : normalizeNamePart(player?.lastName);
    return `${firstName || ""} ${lastName || ""}`.trim();

}

function getInitial(value = "") {
    return normalizeNamePart(value).slice(0, 1);
}

function joinNameParts(parts: string[]) {
    return parts.map(normalizeNamePart).filter(Boolean).join(" ");
}

function hasRating(player: Player) {
    const rating = player?.rating;
    return rating !== null && typeof rating !== "undefined" && `${rating}`.trim().length > 0;
}

export function getPlayerNameFormatted(player: Player, format: PlayerNameFormat = "partial") {
    if (!isPartialNameEntered(player)) {
        return "";
    }

    const firstName = normalizeNamePart(player?.firstName);
    const lastName = normalizeNamePart(player?.lastName);

    if (format === "full") {
        return getPlayerFullName(player) || getPlayerPartialName(player);
    }

    if (format === "firstInitialLastName") {
        return lastName ? joinNameParts([getInitial(firstName), lastName]) : firstName;
    }

    if (format === "firstNameLastInitial") {
        return firstName ? joinNameParts([firstName, getInitial(lastName)]) : lastName;
    }

    return getPlayerPartialName(player);
}

export function getPlayerNameFormattedWithRating(player: Player, format: PlayerNameFormat = "full") {
    const playerName = getPlayerNameFormatted(player, format);

    if (!playerName) {
        return "";
    }

    return hasRating(player) ? `${playerName} (${player.rating})` : playerName;
}

export function getCombinedPlayersFormatted(player1:Player,player2:Player, format: PlayerNameFormat = "partial"){
    if(isPartialNameEntered(player1) && isPartialNameEntered(player2)){
        return [
            getPlayerNameFormatted(player1, format),
            getPlayerNameFormatted(player2, format),
        ].filter(Boolean).join(" / ");
    }
    else{
        if(format === "partial" && isFullNameEntered(player1)){
            return getPlayerFullName(player1);
        }

        return getPlayerNameFormatted(player1, format);
    }
}

export function getCombinedPlayersFormattedWithRating(player1: Player, player2: Player, format: PlayerNameFormat = "full") {
    if (isPartialNameEntered(player1) && isPartialNameEntered(player2)) {
        return [
            getPlayerNameFormattedWithRating(player1, format),
            getPlayerNameFormattedWithRating(player2, format),
        ].filter(Boolean).join(" / ");
    }

    return getPlayerNameFormattedWithRating(player1, format);
}
