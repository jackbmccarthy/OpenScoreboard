
export function isGamePoint(editor: grapesjs.default.Editor) {
    editor.Components.addType('isGamePoint', {
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

                attributes: { class: "isGamePoint", },
            }
        }
    });

    editor.BlockManager.add("isGamePoint", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Custom Game Point',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isGamePoint', dmode: "absolute" },
        category: "Game/Match Point Graphic",
        // layerable:true,
    });
}
