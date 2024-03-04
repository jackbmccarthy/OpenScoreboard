export function loadSolidColorBlocks(editor, fieldList) {

    for (const item of fieldList) {
        // Define a new custom component
        editor.Components.addType(item.field, {
            model: {
                defaults: {
                    // field: item.field,
                    // label: item.label,
                    // sample: item.sample,
                    attributes: { class: item.field },
                    // listener: matchListener,
                    // Add some style, just to make the component visible
                    style: {
                        flex: 1,
                        "background-color": item.sample,
                        display: "flex",
                        height: "100%",
                        width: "100%",
                        "min-height": "10px",
                        "min-width": "10px"
                    },
                    resizable: true,
                    traits: [],
                    //     'script-props': ["listener"],
                    //'script-props': ["field", "label", "sample"]
                }
            }
        });
        editor.Blocks.add(item.field + "-block", {
            label: item.label,
            attributes: { class: 'fa fa-text' },
            content: { type: item.field },
            category: item.category
        });
    }
}
