function isFullNameEntered(player:Player){
    if( player && player.firstName && player.lastName && player.firstName.length > 0 && player.lastName.length > 0){
        return true;
    }
    else{
        return false;
    }
}

function isPartialNameEntered(player:Player){
    if(player && (player.firstName && player.firstName.length > 0)  || player &&  (player.lastName  && player.lastName.length > 0)){
        return true;
    }
    else{
        return false;
    }
}

function getPlayerPartialName(player:Player){
    if( player && player.lastName && player.lastName.length >0){
        return player.lastName;
    }
    
    else if(player && player.firstName && player.firstName.length >0){
        return player.firstName;
    }
    else{
        return "";
    }
}

function getPlayerFullName(player:Player){
    let firstName = player && player.firstNameInitial === true ? player.firstName[0] : player.firstName;
    let lastName = player && player.lastNameInitial === true ? player.firstName[0] : player.lastName;
    return `${firstName} ${lastName}` ;

}

export function getCombinedPlayersFormatted(player1:Player,player2:Player){
    if(isPartialNameEntered(player1) && isPartialNameEntered(player2)){
        return `${getPlayerPartialName(player1)}/${getPlayerPartialName(player2)}`;
    }
    else{
        if(isFullNameEntered(player1)){
            return getPlayerFullName(player1);
        }
        else {
            return getPlayerPartialName(player1);
        }
    }
}