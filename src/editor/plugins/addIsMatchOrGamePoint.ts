import type grapesjs from 'grapesjs'
import { isGamePoint } from "../leftpanel/matchpoint/isGamePoint";
import { isMatchPoint } from "../leftpanel/matchpoint/isMatchPoint";

export function addIsMatchOrGamePoint(editor:grapesjs.Editor){
   isGamePoint(editor)
   isMatchPoint(editor)
}
