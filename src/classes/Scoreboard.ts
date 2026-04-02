export function newScoreboard(ownerID: string, name: string, type: string, alwaysShow = true, showDuringActiveMatch = false, showInBetweenGames = false, isPublic = false) {

    return {
        ownerID: ownerID,
        name: name,
        type: type,
        isPublic: isPublic,
        alwaysShow: alwaysShow,
        showDuringActiveMatch: showDuringActiveMatch,
        showInBetweenGames: showInBetweenGames,
        showDuringTimeOuts: false,
        config: {},
        web: {
            html: "",
            css: "",
            javascript: ""
        }
    }
}
