import db from '../database';
import { getBroadcastChannelName } from './getBroadcastChannelName';

export const updateCurrentMatch = async (currentMatchSnap,isInitialRun, resetListeners, addToListenerList ) => {
    //console.log(resetListeners)
    resetListeners(3);
    let currentMatch = currentMatchSnap.val();
    console.log(currentMatch)
    if(typeof currentMatch ==="object" && Object.keys(currentMatch).includes("cursor")){
        currentMatch = currentMatch["value"]
    }
    if (typeof currentMatch === "string" && currentMatch.length > 0) {
        
        let match = await db.ref(`matches/${currentMatch}`).get();
        const matchValues = match.val();
        for (const key in matchValues) {

            const fieldValue = matchValues[key];
            let bc = new BroadcastChannel(key+getBroadcastChannelName());
            bc.postMessage({ [key]: fieldValue });
            bc.close();


        }

        for (const key of Object.keys(match.val())) {
            let matchRef = db.ref(`matches/${currentMatch}/${key}`);
            if (isInitialRun) {
                matchRef.on("value", (snapShot) => {
                    console.log(snapShot.val())
                    if (snapShot.val() !== null && snapShot.val()["cursor"] === undefined) {
                        console.log(key, snapShot.val());
                        console.log(key+getBroadcastChannelName())
                        if(typeof snapShot.val() ==="object" && Object.keys(snapShot.val()).includes("cursor")){
                            console.log("bad update value")
                        }
                        else{
                            let bc = new BroadcastChannel(key+getBroadcastChannelName());
                        bc.postMessage({ [key]: snapShot.val() });
                        bc.close();
                        }
                        
                        //window.postMessage({ [key]: snapShot.val() });
                    }

                });
                addToListenerList(() => { matchRef.off("value"); });
            }
            else {
                let snapShot = await matchRef.get();
                if (snapShot.val() !== null && snapShot.val()["cursor"] === undefined) {
                     console.log(snapShot.val());
                    let bc = new BroadcastChannel(key+getBroadcastChannelName());
                    bc.postMessage({ [key]: snapShot.val() });
                    bc.close();
                    //window.postMessage({ [key]: snapShot.val() });
                }
            }

        }

    }
};

export const updateTeamMatch = async (currentMatchSnap,isInitialRun, resetListeners, addToListenerList ) => {
    // Resolve from Snapshot to values
    let currentMatch = currentMatchSnap.val();

    let matchFieldListenerRemovalList = [];
    // console.log(currentMatch, typeof currentMatch === "string", currentMatch.length);
    if (typeof currentMatch === "string" && currentMatch.length > 0) {
        let match = await db.ref(`matches/${currentMatch}`).get();
        window.postMessage(match.val());
        // console.log(match.val());
        for (const key of Object.keys(match.val())) {

            //console.log(key,`matches/${currentMatch}/${key}`);
            let matchRef = db.ref(`matches/${currentMatch}/${key}`);
            if (isInitialRun) {
                matchRef.on("value", (snapShot) => {

                    if (snapShot.val() !== null && snapShot.val()["cursor"] === undefined) {
                        //console.log(snapShot.val());
                        let bc = new BroadcastChannel(key+getBroadcastChannelName());
                        bc.postMessage({ [key]: snapShot.val() });
                        bc.close();
                        //window.postMessage({ [key]: snapShot.val() });
                    }

                });
                addToListenerList(() => { matchRef.off("value"); });

            }
            else {
                let snapShot = await matchRef.get();
                if (snapShot.val() !== null && snapShot.val()["cursor"] === undefined) {
                    //console.log(snapShot.val());
                    let bc = new BroadcastChannel(key+getBroadcastChannelName());
                        bc.postMessage({ [key]: snapShot.val() });
                        bc.close();
                }
            }

        }

    }
    return matchFieldListenerRemovalList;
};
export const updateTeamAID = async (TeamASnap,isInitialRun, resetListeners, addToListenerList ) => {
    let teamAID = TeamASnap.val();
    console.log(teamAID);
    if (typeof teamAID === "string") {
        if (isInitialRun) {
            let teamRef = db.ref(`teams/${teamAID}/teamName`);
            teamRef.on("value", (teamNameSnap) => {
                let teamName = teamNameSnap.val();
                if (typeof teamName === "string") {
                    let bc = new BroadcastChannel("teamAName"+getBroadcastChannelName());
                        bc.postMessage({  teamAName: teamNameSnap.val() });
                        bc.close();
                    //window.postMessage({ teamAName: teamNameSnap.val() });
                }
            });
            addToListenerList(() => { teamRef.off("value"); });
            let teamLogoRef = db.ref(`teams/${teamAID}/teamLogoURL`);
            teamLogoRef.on("value", (teamLogoSnap) => {
                let teamLogo = teamLogoSnap.val();
                if (typeof teamLogo === "string") {
                    let bc = new BroadcastChannel("teamLogoURLA"+getBroadcastChannelName());
                    bc.postMessage({  teamLogoURLA: teamLogoSnap.val()});
                    bc.close();
                    //window.postMessage({ teamLogoURLA:  });
                }
            });
            addToListenerList(() => { teamLogoRef.off("value"); });
        }
        else {
            let teamNameSnap = await db.ref(`teams/${teamAID}/teamName`).get();
            let teamName = teamNameSnap.val();
            if (typeof teamName === "string") {
                let bc = new BroadcastChannel("teamAName"+getBroadcastChannelName());
                bc.postMessage({  teamAName: teamNameSnap.val() });
                bc.close();
                //window.postMessage({ teamAName: teamNameSnap.val() });
            }
            let teamLogoSnap = await db.ref(`teams/${teamAID}/teamLogoURL`).get();
            let teamLogo = teamLogoSnap.val();
            if (typeof teamLogo === "string") {
                let bc = new BroadcastChannel("teamLogoURLA"+getBroadcastChannelName());
                bc.postMessage({ teamLogoURLA: teamLogoSnap.val() });
                bc.close();
              //  window.postMessage({  });
            }

        }


    }
};

export const updateTeamBID = async (TeamBSnap,isInitialRun, resetListeners, addToListenerList ) => {
    let teamBID = TeamBSnap.val();
    console.log(teamBID);
    if (typeof teamBID === "string") {
        if (isInitialRun) {
            let teamRef = db.ref(`teams/${teamBID}/teamName`);
            teamRef.on("value", (teamNameSnap) => {
                let teamName = teamNameSnap.val();
                if (typeof teamName === "string") {
                    let bc = new BroadcastChannel("teamBName"+getBroadcastChannelName());
                bc.postMessage({ teamBName: teamNameSnap.val()  });
                bc.close();
                    window.postMessage({ teamBName: teamNameSnap.val() });
                }
            });
            addToListenerList(() => { teamRef.off("value"); });
            let teamLogoRef = db.ref(`teams/${teamBID}/teamLogoURL`);
            teamLogoRef.on("value", (teamLogoSnap) => {
                let teamLogo = teamLogoSnap.val();
                if (typeof teamLogo === "string") {
                    let bc = new BroadcastChannel("teamLogoURLB"+getBroadcastChannelName());
                bc.postMessage({ teamLogoURLB: teamLogoSnap.val() });
                bc.close();
                    window.postMessage({ teamLogoURLB: teamLogoSnap.val() });
                }
            });
            addToListenerList(() => { teamLogoRef.off("value"); });
        }
        else {
            let teamNameSnap = await db.ref(`teams/${teamBID}/teamName`).get();
            let teamName = teamNameSnap.val();
            if (typeof teamName === "string") {
                let bc = new BroadcastChannel("teamBName"+getBroadcastChannelName());
                bc.postMessage({ teamBName:  teamNameSnap.val() });
                bc.close();
                window.postMessage({ teamBName: teamNameSnap.val() });
            }

            let teamLogoSnap = await db.ref(`teams/${teamBID}/teamLogoURL`).get();
            let teamLogo = teamLogoSnap.val();
            if (typeof teamLogo === "string") {
                let bc = new BroadcastChannel("teamLogoURLB"+getBroadcastChannelName());
                bc.postMessage({ teamLogoURLB: teamLogoSnap.val() });
                bc.close();
                window.postMessage({ teamLogoURLB: teamLogoSnap.val() });
            }
        }


    }
};

export const updateTeamAScore = async (TeamASnap) => {
    let teamAScore = TeamASnap.val();
    console.log(teamAScore);
    if (typeof teamAScore === "string" || typeof teamAScore === "number") {
        let bc = new BroadcastChannel("teamAScore"+getBroadcastChannelName());
                bc.postMessage({ teamAScore:  TeamASnap.val()});
                bc.close();
        window.postMessage({ teamAScore: TeamASnap.val() });

    }
};

export const updateTeamBScore = async (TeamBSnap) => {
    let teamBScore = TeamBSnap.val();
    console.log(teamBScore);
    if (typeof teamBScore === "string" || typeof teamBScore === "number") {
        let bc = new BroadcastChannel("teamBScore"+getBroadcastChannelName());
                bc.postMessage({  teamBScore:  TeamBSnap.val() });
                bc.close();
        window.postMessage({ teamBScore: TeamBSnap.val() });

    }

};
export const updateTeamALogoURL = async (TeamASnap) => {
    let teamAScore = TeamASnap.val();
    console.log(teamAScore);
    if (typeof teamAScore === "string") {
        let bc = new BroadcastChannel("teamLogoURLA"+getBroadcastChannelName());
                bc.postMessage({ teamLogoURLA: TeamASnap.val()  });
                bc.close();
        window.postMessage({ teamLogoURLA: TeamASnap.val() });

    }
};

export const updateTeamBLogoURL = async (TeamBSnap) => {
    let teamBScore = TeamBSnap.val();
    console.log(teamBScore);
    if (typeof teamBScore === "string") {
        let bc = new BroadcastChannel("teamLogoURLB"+getBroadcastChannelName());
                bc.postMessage({teamLogoURLB: TeamBSnap.val()  });
                bc.close();
        window.postMessage({ teamLogoURLB: TeamBSnap.val() });

    }

};