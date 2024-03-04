import { isGamePoint } from "../leftpanel/matchpoint/isGamePoint";
import { isMatchPoint } from "../leftpanel/matchpoint/isMatchPoint";

export function addIsMatchOrGamePoint(editor:grapesjs.default.Editor){
   isGamePoint(editor)
   isMatchPoint(editor)
}

