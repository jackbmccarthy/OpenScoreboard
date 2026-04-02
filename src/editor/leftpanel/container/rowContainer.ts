
export function rowContainer(editor: grapesjs.default.Editor) {
    editor.Components.addType('rowContainer', {
        model: {
            defaults: {
                script: function () {
                    this.style["background-color"] = "#c7c7c76e";
                },
                style: {
                    width: "200px",
                    height: "60px",
                    display: "flex",
                    "flex-direction": "row",
                    "align-items": "center"
                },
                dragMode: "absolute",
                resizable: true
                //droppable:true
                //     'script-': ["listener"],
            }
        }
    });

    editor.BlockManager.add("rowContainer", {
        label: 'Row Container',
        attributes: { class: 'fa fa-text' },
        content: { type: 'rowContainer', dmode: "absolute" },
        category: "Containers",
        // layerable:true,
    });
}
