export function isAYellowCarded(editor: grapesjs.default.Editor) {
    editor.Components.addType('isAYellowCarded', {
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

                attributes: { class: "isAYellowCarded", },
            }
        }
    });

    editor.BlockManager.add("isAYellowCarded", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Yellow Card A',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isAYellowCarded', dmode: "absolute" },
        category: "Penalty Flags",
        // layerable:true,
    });
}
