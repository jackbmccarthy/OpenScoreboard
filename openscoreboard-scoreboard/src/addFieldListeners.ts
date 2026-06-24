import { getBroadcastChannelName } from "./getBroadcastChannelName";
import { runAnimatedFieldAction } from "./animations/scoreboardAnimations";

const fieldUpdateEventName = "open-scoreboard-field-update";
let fieldListenerRemovalList: Array<() => void> = [];

function resetFieldListeners() {
    fieldListenerRemovalList.forEach((removeListener) => {
        removeListener();
    });
    fieldListenerRemovalList = [];
}

function addFieldListenerRemoval(removeListener: () => void) {
    fieldListenerRemovalList.push(removeListener);
}

function hasField(data, field) {
    return data && Object.prototype.hasOwnProperty.call(data, field);
}

function hasAllRequiredFields(currentMatchSettings, requiredFields) {
    return requiredFields.every((field) => hasField(currentMatchSettings, field));
}

function getListenerFields(item) {
    if (Array.isArray(item.listenerFields)) {
        return item.listenerFields;
    }

    if (Array.isArray(item.requiredFields)) {
        return item.requiredFields;
    }

    return null;
}

function createFieldUpdateHandler(callback) {
    let lastSignature = "";
    let lastHandledAt = 0;

    return (data) => {
        const signature = JSON.stringify(data);
        const now = Date.now();

        if (signature === lastSignature && now - lastHandledAt < 50) {
            return;
        }

        lastSignature = signature;
        lastHandledAt = now;
        callback(data);
    };
}

function isTimeoutField(fieldName: string) {
    return fieldName.toLowerCase().includes("timeout");
}


export function addCurrentGameFieldListeners(fieldList) {
    resetFieldListeners();
    console.log("current field list", fieldList)

    for (const item of fieldList) {
        let currentMatchSettings = {};
        let existingNodes = document.getElementsByClassName(item.field);
        //console.log(existingNodes)
        for (const matchNode of existingNodes) {
            const listenerFields = getListenerFields(item);

            if (listenerFields) {
                const handleFieldUpdate = createFieldUpdateHandler((data) => {
                    const relevantData = listenerFields.reduce((updates, field) => {
                        if (hasField(data, field)) {
                            updates[field] = data[field];
                        }

                        return updates;
                    }, {});

                    if (Object.keys(relevantData).length === 0) {
                        return;
                    }

                    currentMatchSettings = { ...currentMatchSettings, ...relevantData };
                    const requiredFields = Array.isArray(item.requiredFields) ? item.requiredFields : [];
                    if (typeof item.action === "function" && hasAllRequiredFields(currentMatchSettings, requiredFields)) {
                        if (isTimeoutField(item.field)) {
                            console.log("OpenScoreboard timeout action", item.field, currentMatchSettings);
                        }
                        runAnimatedFieldAction(matchNode as HTMLElement, item.action, null, currentMatchSettings, item.field)
                    }
                });

                const handleWindowFieldUpdate = (event: Event) => {
                    handleFieldUpdate((event as CustomEvent).detail);
                };
                window.addEventListener(fieldUpdateEventName, handleWindowFieldUpdate);
                addFieldListenerRemoval(() => {
                    window.removeEventListener(fieldUpdateEventName, handleWindowFieldUpdate);
                });

                if (typeof BroadcastChannel !== "undefined") {
                    for (const field of listenerFields) {
                        const bc = new BroadcastChannel(field + getBroadcastChannelName())
                        bc.onmessage = (event) => {
                            handleFieldUpdate(event.data);
                        }
                        addFieldListenerRemoval(() => {
                            bc.onmessage = null;
                            bc.close();
                        });
                    }
                }
            }
            else {
                const handleFieldUpdate = createFieldUpdateHandler((data) => {
                    if (hasField(data, item.field)) {
                        const fieldName = item.field
                        const value = data[item.field]
                        if (typeof item.action === "function") {
                            if (isTimeoutField(fieldName)) {
                                console.log("OpenScoreboard timeout action", fieldName, value);
                            }
                            runAnimatedFieldAction(matchNode as HTMLElement, item.action, value, undefined, fieldName)
                        }


                    }
                });

                const handleWindowFieldUpdate = (event: Event) => {
                    handleFieldUpdate((event as CustomEvent).detail);
                };
                window.addEventListener(fieldUpdateEventName, handleWindowFieldUpdate);
                addFieldListenerRemoval(() => {
                    window.removeEventListener(fieldUpdateEventName, handleWindowFieldUpdate);
                });

                if (typeof BroadcastChannel !== "undefined") {
                    const bc = new BroadcastChannel(item.field + getBroadcastChannelName())
                    bc.onmessage = (event) => {
                        handleFieldUpdate(event.data);
                    }
                    addFieldListenerRemoval(() => {
                        bc.onmessage = null;
                        bc.close();
                    });
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
