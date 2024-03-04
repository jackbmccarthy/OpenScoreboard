export function removeUnwantedButtons(editor) {
    editor.Panels.removeButton("options", "sw-visibility");
    editor.Panels.removeButton("options", "fullscreen");
    editor.Panels.removeButton("options", "export-template");
}
