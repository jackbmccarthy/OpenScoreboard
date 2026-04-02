export function loadImageBlocks(editor, fieldList) {

    for (const item of fieldList) {
        // Define a new custom component
        editor.Components.addType(item.field, {
            model: {
                defaults: {
                    tagName: "img",
                    field: item.field,
                    label: item.label,
                    sample: item.sample,
                    attributes: { class: item.field, src: item.sample, height: "100%" },
                    // listener: matchListener,
                    // Add some style, just to make the component visible
                    style: {
                        // flex: 1,
                        // display: "flex",
                        // "align-items": "center",
                        "object-fit": "cover"
                    },
                    resizable: true,
                    //     components:
                    //     {
                    //         content: `
                    //         <img height="100%"  src="${item.sample}" />
                    //    `
                    //     },
                    //     'script-props': ["listener"],
                    'script-props': ["field", "label", "sample"]
                }
            }
        });
        editor.Blocks.add(item.field + "-block", {
            label: item.label,
            attributes: { class: item.field },
            content: { type: item.field },
            media: `<img data-gjs-name="${item.name}" height="100%" width="100%" src="${item.sample}" />`,
            category: item.category
        });
    }
}
