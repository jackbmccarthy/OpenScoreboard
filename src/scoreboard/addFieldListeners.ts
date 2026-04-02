import { getBroadcastChannelName } from "./getBroadcastChannelName";


export function addCurrentGameFieldListeners(fieldList) {
    console.log("current field list", fieldList)

    for (const item of fieldList) {
        let currentMatchSettings = {};
        let existingNodes = document.getElementsByClassName(item.field);
        //console.log(existingNodes)
        for (const matchNode of existingNodes) {

            if (item.requiredFields) {
                for (const field of item.requiredFields) {
                    let bc = new BroadcastChannel(field+getBroadcastChannelName())
                    bc.onmessage = (event) => {
                        currentMatchSettings = { ...currentMatchSettings, ...event.data };
                        if (typeof item.action === "function") {
                            if (Object.keys(currentMatchSettings).length === item.requiredFields.length)
                                item.action(matchNode, null, currentMatchSettings)
                        }
                    }
                }
            }
            else {
                let bc = new BroadcastChannel(item.field+getBroadcastChannelName())
                bc.onmessage = (event) => {
                    if (event.data && typeof event.data[item.field] !== "undefined") {
                        const fieldName = item.field
                        const value = event.data[item.field]
                        if (typeof item.action === "function") {
                            item.action(matchNode, value)
                        }


                    }
                }

            }


            // window.addEventListener("message", (event) => {
            //     //currentMatchSettings = { ...currentMatchSettings, ...event.data };
            //     //console.log("currentGame",currentMatchSettings);
            //     if (typeof event.data !== "undefined") {
            //         //console.log(item.field)
            //         switch (item.field) {
            //             case "currentAGameScore":
            //                 //console.log("updating :", item.field);
            //                // matchNode.innerText = getCurrentGameScore(currentMatchSettings).a || 0;
            //                 break;
            //             case "currentBGameScore":
            //                 //console.log("updating :", item.field);
            //                // matchNode.innerText = getCurrentGameScore(currentMatchSettings).b || 0;
            //                 break;
            //             case 'currentAMatchScore':
            //               //  matchNode.innerText = getMatchScore(currentMatchSettings).a || 0;
            //                 break;
            //             case 'currentBMatchScore':
            //               //  matchNode.innerText = getMatchScore(currentMatchSettings).b || 0;
            //                 break;
            //             case 'combinedAName':
            //                 // matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2);
            //                 // //console.log("combinedName", document.getElementsByClassName("jerseyColorA"));
            //                 // Array.from(document.getElementsByClassName("jerseyColorA")).forEach((jerseyAEl) => {
            //                 //     //  console.log("updating from combinedA")
            //                 //     jerseyAEl.style.backgroundColor = currentMatchSettings["playerA"].jerseyColor || "transparent";
            //                 // });

            //                 // Array.from(document.getElementsByClassName("countryA")).forEach((countryAEl) => {
            //                 //     //console.log("updating from combinedB")
            //                 //     const countryAFlag = flagData[currentMatchSettings["playerA"].country.toUpperCase()]
            //                 //     if (countryAFlag) {
            //                 //         countryAEl.style.height = "100%"
            //                 //         countryAEl.src = countryAFlag
            //                 //     }
            //                 //     else {
            //                 //         countryAEl.style.height = "0px"
            //                 //     }
            //                 //     ;
            //                 // });
            //                 // Array.from(document.getElementsByClassName("imageURLA")).forEach((imageAEl) => {
            //                 //     //console.log("updating from combinedB")
            //                 //     const AImage = currentMatchSettings["playerA"].imageURL
            //                 //     if (AImage && AImage.length > 0) {
            //                 //         imageAEl.style.height = "100%"
            //                 //         imageAEl.src = AImage
            //                 //     }
            //                 //     else {
            //                 //         imageAEl.style.height = "0px"
            //                 //     }

            //                 // });
            //                 break;
            //             case 'combinedBName':
            //                 // matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);
            //                 // Array.from(document.getElementsByClassName("jerseyColorB")).forEach((jerseyBEl) => {
            //                 //     //  console.log("updating from combinedB")
            //                 //     jerseyBEl.style.backgroundColor = currentMatchSettings["playerB"].jerseyColor || "transparent";
            //                 // });

            //                 // Array.from(document.getElementsByClassName("countryB")).forEach((countryBEl) => {
            //                 //     //  console.log("updating from combinedB",flagData[currentMatchSettings["playerB"].country.toUpperCase()],currentMatchSettings["playerB"].country)

            //                 //     const countryBFlag = flagData[currentMatchSettings["playerB"].country.toUpperCase()]
            //                 //     if (countryBFlag) {
            //                 //         countryBEl.style.height = "100%"
            //                 //         countryBEl.src = countryBFlag
            //                 //     }
            //                 //     else {
            //                 //         countryBEl.style.height = "0px"
            //                 //     }
            //                 // });

            //                 // Array.from(document.getElementsByClassName("imageURLB")).forEach((imageBEl) => {
            //                 //     //console.log("updating from combinedB")
            //                 //     const BImage = currentMatchSettings["playerB"].imageURL
            //                 //     if (BImage && BImage.length > 0) {
            //                 //         imageBEl.style.height = "100%"
            //                 //         imageBEl.src = BImage
            //                 //     }
            //                 //     else {
            //                 //         imageBEl.style.height = "0px"
            //                 //     }
            //                 // });
            //                 break;
            //             case "courtSideAGameScore":
            //                 //console.log("updating :", item.field, currentMatchSettings);
            //                 // const courtSideAScores = getCurrentGameScore(currentMatchSettings)
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     matchNode.innerText = (currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAScores.a : courtSideAScores.b) || 0

            //                 // }
            //                 // else {
            //                 //     matchNode.innerText = (!currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAScores.a : courtSideAScores.b) || 0

            //                 // }
            //                 //matchNode.innerText = getCurrentGameScore(currentMatchSettings).a || 0;
            //                 break;
            //             case "courtSideBGameScore":
            //                 // const courtSideBScores = getCurrentGameScore(currentMatchSettings)
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     matchNode.innerText = (!currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBScores.a : courtSideBScores.b) || 0

            //                 // }
            //                 // else {
            //                 //     matchNode.innerText = (currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBScores.a : courtSideBScores.b) || 0

            //                 // }
            //                 break;
            //             case 'courtSideAMatchScore':
            //                 // const courtSideAMatchScore = getMatchScore(currentMatchSettings);
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     matchNode.innerText = !currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAMatchScore.b : courtSideAMatchScore.a || 0
            //                 // }
            //                 // else {
            //                 //     matchNode.innerText = currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideAMatchScore.b : courtSideAMatchScore.a || 0

            //                 // }

            //                 break;
            //             case 'courtSideBMatchScore':
            //                 // const courtSideBMatchScore = getMatchScore(currentMatchSettings);
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     matchNode.innerText = currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBMatchScore.b : courtSideBMatchScore.a || 0
            //                 // }
            //                 // else {
            //                 //     matchNode.innerText = !currentMatchSettings.isCourtSideScoreboardFlipped ? courtSideBMatchScore.b : courtSideBMatchScore.a || 0

            //                 // }
            //                 break;
            //             case 'courtSideCombinedAName':
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
            //                 //         :
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);


            //                 // }
            //                 // else {
            //                 //     !currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
            //                 //         :
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);

            //                 // }

            //                 break;
            //             case 'courtSideCombinedBName':
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     !currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
            //                 //         :
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);


            //                 // }
            //                 // else {
            //                 //     currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerA, currentMatchSettings.playerA2)
            //                 //         :
            //                 //         matchNode.innerText = getCombinedPlayersFormatted(currentMatchSettings.playerB, currentMatchSettings.playerB2);

            //                 // }
            //                 break;
            //             case 'courtSideIsACurrentlyServing':
            //                 // console.log("courtSideIsACurrentlyServing called")
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     !currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 0 : 1
            //                 //         :
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 1 : 0

            //                 // }
            //                 // else {
            //                 //     currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 0 : 1
            //                 //         :
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 1 : 0
            //                 // }
            //                 // break;
            //             case 'courtSideIsBCurrentlyServing':
            //                 // console.log("courtSideIsBCurrentlyServing called")
            //                 // if (currentMatchSettings.isSwitched) {
            //                 //     !currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 1 : 0
            //                 //         :
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 0 : 1

            //                 // }
            //                 // else {
            //                 //     currentMatchSettings.isCourtSideScoreboardFlipped ?
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 1 : 0
            //                 //         :
            //                 //         matchNode.style.opacity = currentMatchSettings.isACurrentlyServing ? 0 : 1

            //                 // }
            //                 break;

            //             case 'isSecondServer':
            //                 // console.log("isSecondServer", currentMatchSettings.isSecondServer)
            //                 // let interval = setTimeout(() => {
            //                 //     if (currentMatchSettings.isACurrentlyServing && currentMatchSettings.isSecondServer) { //A is serving and 2nd is active
            //                 //         if (matchNode.getAttribute("isa") !== null) { // isA is set, then show it.
            //                 //             matchNode.style.opacity = "1";
            //                 //         }
            //                 //         else{
            //                 //             matchNode.style.opacity = "0";
            //                 //         }
            //                 //     }
            //                 //     else if (!currentMatchSettings.isACurrentlyServing && currentMatchSettings.isSecondServer) {// A is not serving, and 2nd is active
            //                 //         if (matchNode.getAttribute("isa") === null) { //Element does not have isa set. Which means it is b. Show B
            //                 //             matchNode.style.opacity = "1";
            //                 //         }
            //                 //         else{
            //                 //             matchNode.style.opacity = "0";
            //                 //         }
            //                 //     }
            //                 //     else {
            //                 //         if (matchNode.getAttribute("isa") !== null) {
            //                 //             matchNode.style.opacity = "0";
            //                 //         }
            //                 //         if (matchNode.getAttribute("isa") === null) {
            //                 //             matchNode.style.opacity = "0";
            //                 //         }

            //                 //     }
            //                 //     clearTimeout(interval)
            //                 // }, 1)





            //                 break;

            //             default:
            //                 break;
            //         }

            //         // if (item.field.match(/\bplayer[A-B]Score\b/g)) {
            //         //     matchNode.innerText = event.data[item.field].firstName;
            //         // }
            //         // else {
            //         //     console.log("updating :", item.field);
            //         //     matchNode.innerText = event.data[item.field];
            //         // }
            //     }
            //     // console.log(event, matchNode);
            //     // matchNode.innerHTML=event.data[item.field];
            // });
        }
    }
}