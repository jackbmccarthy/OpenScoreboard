import db from "../database"

export async function getScoreboardSettings(scoreboardID, ){
    let settings = await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/showDuringActiveMatch`).get(),
        db.ref(`scoreboards/${scoreboardID}/showDuringTimeOuts`).get(),
        db.ref(`scoreboards/${scoreboardID}/alwaysShow`).get(),
        db.ref(`scoreboards/${scoreboardID}/showInBetweenGames`).get(),
        ])
        setShowDuringActiveMatch(scoreboardID, settings[0].val())
        setShowDuringTimeOuts(scoreboardID, settings[1].val())
        setAlwaysShow(scoreboardID, settings[2].val())
        setShowInBetweenGames(scoreboardID, settings[3].val())

}

function isRelevantToScoreboardSetting(eventData){
    if(typeof eventData ==="object"){
       const isReleventList = Object.keys(eventData).filter((keyName)=>{
           return ["isInBetweenGames", "isATimeOutActive","isBTimeOutActive", "isMatchStarted" ].includes(keyName)
        })
        return isReleventList.length > 0 ? true :false
    }
}

function animateScoreboardFadeAway(rootNode){
    
    var fadeOutEffect = setInterval(function () {
        if (!rootNode.style.opacity) {
            rootNode.style.opacity = 1;
        }
        if (rootNode.style.opacity > 0) {
            rootNode.style.opacity -= 0.033;
        } else {
            rootNode.style.opacity = 0;
            clearInterval(fadeOutEffect);
        }
    }, 1000/30);
}

function animateScoreboardFadeIn(rootNode){
    let opacity = 0
    var fadeInEffect = setInterval(function () {
        if (!rootNode.style.opacity || rootNode.style.opacity < 1) {
            opacity +=0.033
            rootNode.style.opacity = opacity
        } else {
            rootNode.style.opacity = 1;
            clearInterval(fadeInEffect);
        }
    }, 1000/30);
}



export function addScoreboardSettingListeners(scoreboardID, rootNode){
    let currentContext = {}
    //let rootNode = document.createElement("div")
    window.addEventListener("message", (event)=>{
        currentContext = {...currentContext,...event.data}
        //console.log(event.data)
        if(!getAlwaysShow(scoreboardID)){
            if (isRelevantToScoreboardSetting(event.data) ){
                if(getShowInBetweenGames(scoreboardID) && typeof event.data["isInBetweenGames"] !=="undefined"){
                        if(event.data["isInBetweenGames"]){
                            animateScoreboardFadeIn(rootNode)
                        }
                        else{
                            animateScoreboardFadeAway(rootNode)
                        }
                    }
                
                // if(typeof event.data["isATimeOutActive"] !=="undefined" || typeof event.data["isBTimeOutActive"] !=="undefined"){

                // }
                if(getShowDuringActiveMatch(scoreboardID) && (typeof event.data["isMatchStarted"] !=="undefined" || typeof event.data["isInBetweenGames"] !=="undefined" )){
                    if(currentContext["isMatchStarted"] && !currentContext["isInBetweenGames"]){
                        animateScoreboardFadeIn(rootNode)
                    }
                    else{
                        animateScoreboardFadeAway(rootNode)
                    }
                }

        }
        }
        
    })
}

function getShowDuringActiveMatch(scoreboardID){
    return localStorage.getItem(scoreboardID+"_showDuringActiveMatch") ==="true"? true :false
}

function getShowInBetweenGames(scoreboardID){
    return  localStorage.getItem(scoreboardID+"_showInBetweenGames") ==="true"? true :false
}

function getShowDuringTimeOuts(scoreboardID){
    return  localStorage.getItem(scoreboardID+"_showDuringTimeOuts") ==="true"? true :false
}

function getAlwaysShow(scoreboardID){
    return  localStorage.getItem(scoreboardID+"_alwaysShow") ==="true"? true :false
}

function setShowDuringActiveMatch(scoreboardID ,value){
    localStorage.setItem(scoreboardID+"_showDuringActiveMatch",value ? "true":"false")
}

function setShowInBetweenGames(scoreboardID,value){
    localStorage.setItem(scoreboardID+"_showInBetweenGames",value? "true":"false")
}

function setShowDuringTimeOuts(scoreboardID,value){
    localStorage.setItem(scoreboardID+"_showDuringTimeOuts",value? "true":"false")
}

function setAlwaysShow(scoreboardID,value){
    localStorage.setItem(scoreboardID+"_alwaysShow",value? "true":"false")
}