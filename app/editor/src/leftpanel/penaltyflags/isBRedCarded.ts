export function isBRedCarded(editor: grapesjs.default.Editor) {
    editor.Components.addType('isBRedCarded', {
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

                attributes: { class: "isBRedCarded", },
            }
        }
    });

    editor.BlockManager.add("isBRedCarded", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Red Card B',
        attributes: { class: 'fa fa-text' },
        content: { type: 'isBRedCarded', dmode: "absolute" },
        category: "Penalty Flags",
        // layerable:true,
    });
}
