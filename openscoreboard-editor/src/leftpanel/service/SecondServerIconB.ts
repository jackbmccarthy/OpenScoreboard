
export function SecondServerIconB(editor: grapesjs.default.Editor) {
    editor.Components.addType('SecondServerIconB', {
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

                attributes: { class: "isSecondServer", isA: false, },
            }
        }
    });

    editor.BlockManager.add("SecondServerIconB", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Second Server Icon B',
        attributes: { class: 'fa fa-text' },
        content: { type: 'SecondServerIconB', dmode: "absolute" },
        category: "Service Icons",
        // layerable:true,
    });
}
