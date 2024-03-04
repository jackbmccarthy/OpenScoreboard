export function newScoreboard(ownerID, name, type, alwaysShow=true, showDuringActiveMatch=false,showInBetweenGames=false, isPublic=false){

    return {
        ownerID:ownerID,
        name: name,
        type:type,
        isPublic:isPublic,
        alwaysShow: alwaysShow,
        showDuringActiveMatch: showDuringActiveMatch,
        showInBetweenGames:showInBetweenGames,
        showDuringTimeOuts: false,
        config:{},
        web:{
            html:"",
            css:"",
            javascript:""
        }
    }
}