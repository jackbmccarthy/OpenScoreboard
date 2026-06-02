export function isTimeOutActive(editor: grapesjs.default.Editor) {
    editor.Components.addType('isTimeOutActive', {
        model: {
            defaults: {
                components: "Time Out",
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

                attributes: { class: "isTimeOutActive", },
            }
        }
    });

    editor.BlockManager.add("isTimeOutActive", {
        label: 'Time Out Active',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isTimeOutActive', dmode: "absolute" },
        category: "Time Outs",
    });
}
