
export function courtSideIsACurrentlyServing(editor: grapesjs.default.Editor) {
    editor.Components.addType('courtSideIsACurrentlyServing', {
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

                attributes: { class: "courtSideIsACurrentlyServing", },
            }
        }
    });

    editor.BlockManager.add("courtSideIsACurrentlyServing", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'A Serving',
        attributes: { class: 'fa fa-text' },
        content: { type: 'courtSideIsACurrentlyServing', dmode: "absolute" },
        category: "Court Side",
    });
}
