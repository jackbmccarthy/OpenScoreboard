export function isARedCarded(editor: grapesjs.default.Editor) {
    editor.Components.addType('isARedCarded', {
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

                attributes: { class: "isARedCarded", },
            }
        }
    });

    editor.BlockManager.add("isARedCarded", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Red Card A',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isARedCarded', dmode: "absolute" },
        category: "Penalty Flags",
        // layerable:true,
    });
}
