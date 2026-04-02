
export function isMatchPoint(editor: grapesjs.default.Editor) {
    editor.Components.addType('isMatchPoint', {
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

                attributes: { class: "isMatchPoint", },
            }
        }
    });

    editor.BlockManager.add("isMatchPoint", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Custom Match Point',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isMatchPoint', dmode: "absolute" },
        category: "Game/Match Point Graphic",
        // layerable:true,
    });
}
