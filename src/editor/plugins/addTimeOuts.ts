// @ts-nocheck
import { isATimeOutActive } from "../leftpanel/timeout/isATimeOutActive";
import { isBTimeOutActive } from "../leftpanel/timeout/isBTimeOutActive";

export function addTimeOuts(editor:grapesjs.Editor){
   isATimeOutActive(editor)
   isBTimeOutActive(editor)

   
}

