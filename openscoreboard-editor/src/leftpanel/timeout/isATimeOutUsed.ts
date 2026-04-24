
export function isATimeOutUsed(editor: grapesjs.default.Editor) {
    editor.Components.addType('isATimeOutUsed', {
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

                attributes: { class: "isATimeOutUsed", },
            }
        }
    });

    editor.BlockManager.add("isATimeOutUsed", {
        label: 'Time Out Used A',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isATimeOutUsed', dmode: "absolute" },
        category: "Time Outs",
    });
}
