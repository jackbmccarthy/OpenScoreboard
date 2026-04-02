export function loadTextBlocks(editor, fieldList) {

    for (const item of fieldList) {
        // Define a new custom component
        editor.Components.addType(item.field, {
            model: {
                defaults: {
                    script: function (props) {
                        this.innerText = props.sample;
                    },
                    field: item.field,
                    label: item.label,
                    sample: item.sample,
                    attributes: { class: item.field },
                    // listener: matchListener,
                    // Add some style, just to make the component visible
                    style: {
                        flex: 1,
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        "justify-content": item.justify,
                        "align-items": "center"
                    },
                    resizable: true,
                    traits: [],
                    //     'script-props': ["listener"],
                    'script-props': ["field", "label", "sample"]
                }
            }
        });
        editor.Blocks.add(item.field + "-block", {
            label: `<h3>${item.label}</h3>`,
            attributes: { class: 'fa fa-text' },
            content: { type: item.field },
            category: item.category
        });
    }
}
