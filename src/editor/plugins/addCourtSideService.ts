import type grapesjs from 'grapesjs'
import { courtSideIsACurrentlyServing } from "../leftpanel/courtside/courtSideIsACurrentlyServing";
import { courtSideIsBCurrentlyServing } from "../leftpanel/courtside/courtSideIsBCurrentlyServing";

export function addCourtSideService(editor:grapesjs.Editor) {
    courtSideIsACurrentlyServing(editor)
    courtSideIsBCurrentlyServing(editor)

}
