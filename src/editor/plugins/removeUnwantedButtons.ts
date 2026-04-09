import type grapesjs from 'grapesjs'

export function removeUnwantedButtons(editor: grapesjs.Editor) {
    editor.Panels.removeButton("options", "sw-visibility");
    editor.Panels.removeButton("options", "fullscreen");
    editor.Panels.removeButton("options", "export-template");
}
