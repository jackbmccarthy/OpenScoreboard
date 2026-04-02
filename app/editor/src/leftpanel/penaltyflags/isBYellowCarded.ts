export function isBYellowCarded(editor: grapesjs.default.Editor) {
    editor.Components.addType('isBYellowCarded', {
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

                attributes: { class: "isBYellowCarded", },
            }
        }
    });

    editor.BlockManager.add("isBYellowCarded", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Yellow Card B',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isBYellowCarded', dmode: "absolute" },
        category: "Penalty Flags",
        // layerable:true,
    });
}
