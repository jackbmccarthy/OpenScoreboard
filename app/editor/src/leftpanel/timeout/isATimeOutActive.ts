
export function isATimeOutActive(editor: grapesjs.default.Editor) {
    editor.Components.addType('isATimeOutActive', {
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

                attributes: { class: "isATimeOutActive", },
            }
        }
    });

    editor.BlockManager.add("isATimeOutActive", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Time Out A',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isATimeOutActive', dmode: "absolute" },
        category: "Time Outs",
    });
}
