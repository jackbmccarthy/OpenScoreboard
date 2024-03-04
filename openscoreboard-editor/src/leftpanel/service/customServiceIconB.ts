
export function customServiceIconB(editor: grapesjs.default.Editor) {
    editor.Components.addType('customServiceIconB', {
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

                attributes: { class: "isACurrentlyServing", isA: false, },
            }
        }
    });

    editor.BlockManager.add("customServiceIconB", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Custom Service Icon B',
        attributes: { class: 'fa fa-text' },
        content: { type: 'customServiceIconB', dmode: "absolute" },
        category: "Service Icons",
        // layerable:true,
    });
}
