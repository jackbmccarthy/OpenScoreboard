
export function customServiceIconA(editor: grapesjs.default.Editor) {
    editor.Components.addType('customServiceIconA', {
        model: {
            defaults: {
                style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    "flex-direction": "row",
                    "align-items": "center",
                },
                attributes: { class: "isACurrentlyServing", isA: true, },
                //dragMode: "absolute",
                resizable: true
                //droppable:true
                //     'script-props': ["listener"],
            }
        }
    });

    editor.BlockManager.add("customServiceIconA", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Custom Service Icon A',
        attributes: { class: 'fa fa-text' },
        content: { type: 'customServiceIconA', dmode: "absolute" },
        category: "Service Icons",
        // layerable:true,
    });
}
