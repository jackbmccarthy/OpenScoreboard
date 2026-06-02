const unsavedChangesMessage = "You have unsaved scoreboard changes. Are you sure you want to leave without saving?";

function hasUnsavedChanges(editor: grapesjs.default.Editor) {
    if (typeof editor.getDirtyCount !== "function") {
        return false;
    }

    return editor.getDirtyCount() > 0;
}

export function installUnsavedChangesPrompt(editor: grapesjs.default.Editor) {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!hasUnsavedChanges(editor)) {
            return;
        }

        event.preventDefault();
        event.returnValue = unsavedChangesMessage;

        return unsavedChangesMessage;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    editor.on("destroy", () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
    });
}
