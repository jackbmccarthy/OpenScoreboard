import type grapesjs from 'grapesjs'

export function SecondServerIconA(editor: grapesjs.Editor) {

    editor.Components.addType('SecondServerIconA', {
        model: {
            defaults: {
                style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    "flex-direction": "row",
                    "align-items": "center",
                },
                attributes: { class: "isSecondServer", isA: true, },
                //dragMode: "absolute",
                resizable: true
                //droppable:true
                //     'script-props': ["listener"],
            }
        }
    });

    editor.BlockManager.add("SecondServerIconA", {
        // media: `<img src="${defaultServiceIconSVG}" />`,
        label: 'Second Server Icon A',
        attributes: { class: 'fa fa-text' },
        content: { type: 'SecondServerIconA', dmode: "absolute" },
        category: "Service Icons",
        // layerable:true,
    });
}
