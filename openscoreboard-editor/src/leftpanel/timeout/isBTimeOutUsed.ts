
export function isBTimeOutUsed(editor: grapesjs.default.Editor) {
    editor.Components.addType('isBTimeOutUsed', {
        model: {
            defaults: {
                components: "Time Out Used",
                style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    "flex-direction": "row",
                    "align-items": "center",
                    "justify-content": "center",
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
