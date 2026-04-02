import { isARedCarded } from "../leftpanel/penaltyflags/isARedCarded"
import { isAYellowCarded } from "../leftpanel/penaltyflags/isAYellowCarded"
import { isBRedCarded } from "../leftpanel/penaltyflags/isBRedCarded"
import { isBYellowCarded } from "../leftpanel/penaltyflags/isBYellowCarded"

export function addFlagPenalties(editor:grapesjs.default.Editor){
    isAYellowCarded(editor)
    isBYellowCarded(editor)
    
    isARedCarded(editor)
    isBRedCarded(editor)
}

