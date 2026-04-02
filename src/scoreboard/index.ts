// Scoreboard module - exported functions
// Call these from React components

import db from '@/lib/database';
import { defaultScoreboard } from './templates/defaultscoreboard';
import { addScoreboardSettingListeners, getScoreboardSettings} from './addScoreboardSettingListeners';
import { dynamicURLListener } from './dynamicurls';
import { runAllListeners } from './runAllListeners';
import { addCSS } from './addCSS';

export let listenerRemovalList: { (): void }[] = []

export function resetListeners() {
  if (listenerRemovalList.length > 0) {
    for (const listenerRemoval of listenerRemovalList) {
      listenerRemoval()
    }
    listenerRemovalList = []
  }
}

export function addToListenerList(removeFunc: { (): void }) {
  listenerRemovalList.push(removeFunc)
}

export async function runScoreboard(
  scoreboardID: string | null,
  tableID: string | null = null,
  teamMatchID: string | null = null,
  tableNumber: string | null = null
) {
  const root = document.getElementById("gjs");
  await getScoreboardSettings(scoreboardID)
  addScoreboardSettingListeners(scoreboardID, root)
  let isInitialRun = true;
  
  if (scoreboardID === null && root !== null) {
    // Loading the default scoreboard
    root.innerHTML = defaultScoreboard.html
    document.head.appendChild(document.createElement("style")).innerHTML = defaultScoreboard.css;
    if (isInitialRun) {
      runAllListeners(isInitialRun, tableID, teamMatchID, tableNumber, resetListeners, addToListenerList);
      isInitialRun = false;
    } else {
      runAllListeners(isInitialRun, tableID, teamMatchID, tableNumber, resetListeners, addToListenerList);
    }
  } else {
    db.ref(`/scoreboards/${scoreboardID}/web/html`).on("value", (html: any) => {
      const newHTML = html.val();
      if (typeof newHTML === "string" && root !== null) {
        root.innerHTML = newHTML;

        if (isInitialRun) {
          runAllListeners(isInitialRun, tableID, teamMatchID, tableNumber, resetListeners, addToListenerList);
          isInitialRun = false;
        } else {
          runAllListeners(isInitialRun, tableID, teamMatchID, tableNumber, resetListeners, addToListenerList);
        }
      }
    });
    
    db.ref(`/scoreboards/${scoreboardID}/web/css`).on("value", (css: any) => {
      const scoreboardCSSTag = document.getElementById("newstyle")
      if (scoreboardCSSTag) {
        scoreboardCSSTag.remove()
      }
      
      const newCSS = css.val();
      if (typeof newCSS === "string") {
        addCSS(newCSS);
      }
    });
  }
}

export async function setupDynamicURL(dynamicURLID: string) {
  dynamicURLListener(dynamicURLID, (details: any) => {
    const { id, dynamicURLName, tableID, teammatchID, tableNumber, scoreboardID } = details
    console.log(details)
    resetListeners()
    runScoreboard(scoreboardID, tableID, teammatchID, tableNumber)
  })
}
