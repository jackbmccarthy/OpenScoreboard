import { BorderBottom } from "../rightpanel/border/BorderBottom";
import { BorderLeft } from "../rightpanel/border/BorderLeft";
import { BorderRight } from "../rightpanel/border/BorderRight";
import { BorderTop } from "../rightpanel/border/BorderTop";

export function loadBorderStyles(editor:grapesjs.default.Editor) {
    editor.StyleManager.addSector('Borders', {
        name: 'Borders',
        open: false,
    });
    BorderTop(editor)
    BorderBottom(editor)
    BorderLeft(editor)
    BorderRight(editor)
}

