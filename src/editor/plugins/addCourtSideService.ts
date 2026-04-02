import { courtSideIsACurrentlyServing } from "../leftpanel/courtside/courtSideIsACurrentlyServing";
import { courtSideIsBCurrentlyServing } from "../leftpanel/courtside/courtSideIsBCurrentlyServing";

export function addCourtSideService(editor:grapesjs.default.Editor) {
    courtSideIsACurrentlyServing(editor)
    courtSideIsBCurrentlyServing(editor)

}

