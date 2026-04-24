
export function isTimeOutActive(editor: grapesjs.default.Editor) {
    editor.Components.addType('isTimeOutActive', {
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

                attributes: { class: "isTimeOutActive", },
            }
        }
    });

    editor.BlockManager.add("isTimeOutActive", {
        label: 'Time Out',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isTimeOutActive', dmode: "absolute" },
        category: "Time Outs",
    });
}
