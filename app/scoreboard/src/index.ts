import db from '../database';
import { defaultScoreboard } from './templates/defaultscoreboard';
import { addScoreboardSettingListeners, getScoreboardSettings} from './addScoreboardSettingListeners';
import { dynamicURLListener } from './dynamicurls';
import { runAllListeners } from './runAllListeners';
import { addCSS } from './addCSS';

export let listenerRemovalList:{ (): void; }[] = []

export interface ScoreboardConfig {
  container: HTMLElement;
  matchId?: string;
  tableId?: string;
  teamMatchId?: string;
  tableNumber?: string;
  dynamicUrlId?: string;
}

const resetListeners = ()=>{
    
    if(listenerRemovalList.length > 0){
        for (const listenerRemoval of listenerRemovalList) {
            listenerRemoval()
        }
        listenerRemovalList = []
    }
}

const addToListenerList = (removeFunc:{():void}) =>{
    listenerRemovalList.push(removeFunc)
}


async function runScoreboard(container: HTMLElement, scoreboardID:string|null, tableID:string|null=null, teamMatchID:string|null=null, tableNumber:string|null=null, ) {
    // Use the provided container instead of document.getElementById("gjs")
    let root = container;
    await getScoreboardSettings(scoreboardID)
    addScoreboardSettingListeners(scoreboardID, root)
    let isInitialRun = true;
    if (scoreboardID === null && root !== null) {
        // Loading the default scoreboard
        root.innerHTML = defaultScoreboard.html
        document.head.appendChild(document.createElement("style")).innerHTML = defaultScoreboard.css;
        if (isInitialRun) {
            runAllListeners(isInitialRun,tableID, teamMatchID, tableNumber, resetListeners, addToListenerList);
            isInitialRun = false;
        }
        else {
            runAllListeners(isInitialRun,tableID, teamMatchID, tableNumber,resetListeners, addToListenerList);
        }
    }
    else {
        db.ref(`/scoreboards/${scoreboardID}/web/html`).on("value", (html) => {
            let newHTML = html.val();
            if (typeof newHTML === "string" && root !== null) {
                root.innerHTML = newHTML;

                if (isInitialRun) {
                    runAllListeners(isInitialRun, tableID, teamMatchID, tableNumber ,resetListeners, addToListenerList);
                    isInitialRun = false;
                }
                else {
                    runAllListeners(isInitialRun,tableID, teamMatchID, tableNumber,resetListeners, addToListenerList);
                }
            }

        });
        db.ref(`/scoreboards/${scoreboardID}/web/css`).on("value", (css) => {
            let scoreboardCSSTag = document.getElementById("newstyle")
            if (scoreboardCSSTag) {
                scoreboardCSSTag.remove() // Remove old styles in case of reload
            }
            
            let newCSS = css.val();
            if (typeof newCSS === "string") {
                addCSS(newCSS);
            }

        });
    }







}

async function setupDynamicURL(dynamicURLID: string, container: HTMLElement){
   // let details = await getDynamicURLDetails(dynamicURLID)
    

        dynamicURLListener(dynamicURLID, (details)=>{
            const {id,
        dynamicURLName,
        tableID,
        teammatchID,
        tableNumber,
        scoreboardID} = details
        console.log(details)
        resetListeners()
        runScoreboard(container, scoreboardID,tableID,teammatchID,tableNumber)

        })
        

}

/**
 * Initialize the scoreboard with the given configuration.
 * @param config - Configuration object containing container and optional IDs
 */
export function init(config: ScoreboardConfig): () => void {
    const { container, matchId, tableId, teamMatchId, tableNumber, dynamicUrlId } = config;
    
    resetListeners();

    if (dynamicUrlId && dynamicUrlId.length > 0) {
        setupDynamicURL(dynamicUrlId, container);
    } else if (tableId || teamMatchId) {
        runScoreboard(container, matchId || null, tableId || null, teamMatchId || null, tableNumber || null);
    }

    // Return cleanup function
    return () => {
        resetListeners();
    };
}

// Legacy initialization for direct script include (URL params based)
export function initFromURL(container: HTMLElement): () => void {
    const params = new URLSearchParams(window.location.search);
    const tableID= params.get("tid")
    const teamMatchID = params.get("tmid")
    const teamMatchTableNumber = params.get("table")
    const dynamicURLID =params.get("dynid")
    const scoreboardID = params.get("sid");

    if (params.get("t") === "table" && (params.get("tid") !== null || params.get("tmid") !== null)) {
        resetListeners()
        runScoreboard(container, scoreboardID, tableID, teamMatchID, teamMatchTableNumber);
    }
    else if(dynamicURLID !== null && dynamicURLID.length > 0 ){
        setupDynamicURL(dynamicURLID, container)
    }

    return () => {
        resetListeners();
    };
}



