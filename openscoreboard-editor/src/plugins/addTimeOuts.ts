import { isATimeOutActive } from "../leftpanel/timeout/isATimeOutActive";
import { isATimeOutUsed } from "../leftpanel/timeout/isATimeOutUsed";
import { isBTimeOutActive } from "../leftpanel/timeout/isBTimeOutActive";
import { isBTimeOutUsed } from "../leftpanel/timeout/isBTimeOutUsed";

export function addTimeOuts(editor:grapesjs.default.Editor){
   isATimeOutActive(editor)
   isBTimeOutActive(editor)
   isATimeOutUsed(editor)
   isBTimeOutUsed(editor)

   
}
