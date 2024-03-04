
export function isBTimeOutActive(editor: grapesjs.default.Editor) {
    editor.Components.addType('isBTimeOutActive', {
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

                attributes: { class: "isBTimeOutActive", },
            }
        }
    });

    editor.BlockManager.add("isBTimeOutActive", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Time Out B',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isBTimeOutActive', dmode: "absolute" },
        category: "Time Outs",
    });
}
