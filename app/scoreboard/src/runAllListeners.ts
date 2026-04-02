import db from '../database';
//import { addMatchFieldListeners } from './addMatchFieldListeners';
import { addCurrentGameFieldListeners } from './addFieldListeners';
import { currentGameFieldList } from "./fields/currentGameFieldList";
import { textFieldList } from "./fields/textFieldList";
import { imageFieldList } from "./fields/imageFieldList";
import { courtSideGameFieldList } from "./fields/courtSideGameFieldList";
import { solidColorFieldList } from "./fields/solidColorFieldList";
import { conditionalShowFieldList } from "./fields/conditionalShowFieldList";
import { teamFieldList } from "./fields/teamFieldList";
import { updateCurrentMatch, updateTeamAID, updateTeamAScore, updateTeamBID, updateTeamBScore, updateTeamMatch } from './teamUpdates';

export async function runAllListeners(isInitialRun: boolean, tableID: string | null = null, teamMatchID: string | null = null, tableNumber: string| null = null, resetListeners: { (): void }, addToListenerList: { (data: { (): void }): void }) {
    addCurrentGameFieldListeners([...currentGameFieldList, ...courtSideGameFieldList, ...textFieldList, ...teamFieldList, ...solidColorFieldList, ...conditionalShowFieldList, ...imageFieldList]);

    if (tableID !== null && tableID.length > 0) {
        console.log(isInitialRun)
        if (isInitialRun) {

            let currentMatchRef = db.ref(`tables/${tableID}/currentMatch`);
            currentMatchRef.on("value", (snapshot) => {
                updateCurrentMatch(snapshot, isInitialRun, resetListeners, addToListenerList)
            });

        }
        else {
            console.log("not initial run")
            updateCurrentMatch(await db.ref(`tables/${tableID}/currentMatch`).get(), isInitialRun, resetListeners, addToListenerList);
        }

    }
    if (teamMatchID !== null && tableNumber !== null && teamMatchID.length > 0) {
        if (isInitialRun) {
            console.log("Initial Run Inside", isInitialRun);
            let teamTableRef = db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`);
            let teamAIDRef = db.ref(`teamMatches/${teamMatchID}/teamAID`);
            let teamBIDRef = db.ref(`teamMatches/${teamMatchID}/teamBID`);
            let teamAScoreRef = db.ref(`teamMatches/${teamMatchID}/teamAScore`);
            let teamBScoreRef = db.ref(`teamMatches/${teamMatchID}/teamBScore`);
            // let teamAImgURLRef = db.ref(`teamMatches/${teamMatchID}/teamAScore`);
            // let teamBImgURLRef = db.ref(`teamMatches/${teamMatchID}/teamBScore`);

            teamTableRef.on("value",(val)=>{updateTeamMatch(val, isInitialRun, resetListeners, addToListenerList)} );
            teamAIDRef.on("value",(val)=>{updateTeamAID(val, isInitialRun, resetListeners, addToListenerList)} );
            teamBIDRef.on("value",(val)=>{updateTeamBID(val, isInitialRun, resetListeners, addToListenerList)} );
            teamAScoreRef.on("value",(val)=>{updateTeamAScore(val)} );
            teamBScoreRef.on("value",(val)=>{updateTeamBScore(val)});


            addToListenerList(() => {
                teamTableRef.off("value");
            });
            addToListenerList(() => {
                teamAIDRef.off("value");
            });
            addToListenerList(() => {
                teamBIDRef.off("value");
            });
            addToListenerList(() => {
                teamAScoreRef.off("value");
            });
            addToListenerList(() => {
                teamBScoreRef.off("value");
            });
        }
        else {
            console.log("Initial Run ", isInitialRun);
            updateTeamMatch(await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).get(), isInitialRun, resetListeners, addToListenerList);
            updateTeamAID(await db.ref(`teamMatches/${teamMatchID}/teamAID`).get(), isInitialRun, resetListeners, addToListenerList);
            updateTeamBID(await db.ref(`teamMatches/${teamMatchID}/teamBID`).get(), isInitialRun, resetListeners, addToListenerList);
            updateTeamAScore(await db.ref(`teamMatches/${teamMatchID}/teamAScore`).get());
            updateTeamBScore(await db.ref(`teamMatches/${teamMatchID}/teamBScore`).get());
        }
    }
    else {
        Array.from(document.getElementsByClassName("teamAScore") as HTMLCollectionOf<HTMLElement>).forEach((teamScoreNode) => {
            teamScoreNode.style.display = "none";
        });
        Array.from(document.getElementsByClassName("teamBScore") as HTMLCollectionOf<HTMLElement>).forEach((teamScoreNode) => {
            teamScoreNode.style.display = "none";
        });
        Array.from(document.getElementsByClassName("teamAName") as HTMLCollectionOf<HTMLElement>).forEach((teamScoreNode) => {
            teamScoreNode.style.display = "none";
        });
        Array.from(document.getElementsByClassName("teamBName") as HTMLCollectionOf<HTMLElement>).forEach((teamScoreNode) => {
            teamScoreNode.style.display = "none";
        });
        Array.from(document.getElementsByClassName("teamLogoURLA") as HTMLCollectionOf<HTMLElement>).forEach((teamScoreNode) => {
            teamScoreNode.style.display = "none";
        });
        Array.from(document.getElementsByClassName("teamLogoURLB") as HTMLCollectionOf<HTMLElement>).forEach((teamScoreNode) => {
            teamScoreNode.style.display = "none";
        });
    }


}
