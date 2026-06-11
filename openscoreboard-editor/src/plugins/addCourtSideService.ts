import { courtSideIsACurrentlyServing } from "../leftpanel/courtside/courtSideIsACurrentlyServing";
import { courtSideIsBCurrentlyServing } from "../leftpanel/courtside/courtSideIsBCurrentlyServing";
import { courtSideViews } from "../leftpanel/courtside/courtSideViews";

export function addCourtSideService(editor:grapesjs.default.Editor) {
    courtSideViews(editor)
    courtSideIsACurrentlyServing(editor)
    courtSideIsBCurrentlyServing(editor)

}
