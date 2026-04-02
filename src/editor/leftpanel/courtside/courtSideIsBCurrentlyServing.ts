
export function courtSideIsBCurrentlyServing(editor: grapesjs.default.Editor) {
    editor.Components.addType('courtSideIsBCurrentlyServing', {
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

                attributes: { class: "courtSideIsBCurrentlyServing", },
            }
        }
    });

    editor.BlockManager.add("courtSideIsBCurrentlyServing", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'B Serving',
        attributes: { class: 'fa fa-text' },
        content: { type: 'courtSideIsBCurrentlyServing', dmode: "absolute" },
        category: "Court Side",
    });
}
