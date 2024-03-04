
export function columnContainer(editor: grapesjs.default.Editor) {
    editor.Components.addType('columnContainer', {
        model: {
            defaults: {
                script: function () {
                    if (window.getComputedStyle(this)["background-color"] === "rgba(0, 0, 0, 0)") {
                        this.style["background-color"] = "#c7c7c76e";
                    }

                },
                // listener: matchListener,
                // Add some style, just to make the component visible
                style: {
                    width: "60px",
                    height: "100%",
                    display: "flex",
                    "min-height": "30px",
                    "flex-direction": "column",
                    "align-items": "center",
                },
                dragMode: "absolute",
                resizable: true
            }
        }
    });

    editor.BlockManager.add("columnContainer", {
        label: 'Column Container',
        attributes: { class: 'fa fa-text' },
        content: { type: 'columnContainer', dmode: "absolute" },
        category: "Containers",
        // layerable:true,
    });
}
