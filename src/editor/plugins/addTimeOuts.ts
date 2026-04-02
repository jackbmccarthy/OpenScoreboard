import { isATimeOutActive } from "../leftpanel/timeout/isATimeOutActive";
import { isBTimeOutActive } from "../leftpanel/timeout/isBTimeOutActive";

export function addTimeOuts(editor:grapesjs.default.Editor){
   isATimeOutActive(editor)
   isBTimeOutActive(editor)

   
}

