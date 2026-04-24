
export function isBTimeOutUsed(editor: grapesjs.default.Editor) {
    editor.Components.addType('isBTimeOutUsed', {
        model: {
            defaults: {
                style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    "flex-direction": "row",
                    "align-items": "center",
                },
                dragMode: "absolute",
                resizable: true,

                attributes: { class: "isBTimeOutUsed", },
            }
        }
    });

    editor.BlockManager.add("isBTimeOutUsed", {
        label: 'Time Out Used B',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isBTimeOutUsed', dmode: "absolute" },
        category: "Time Outs",
    });
}
