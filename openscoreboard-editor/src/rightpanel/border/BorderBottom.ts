export function BorderBottom(editor: grapesjs.default.Editor) {
    editor.StyleManager.addProperty('Borders', {
        name: 'Border Bottom',
        property: 'border-bottom',
        type: 'composite',
        properties: [{
            name: 'Width',
            type: 'integer',
            units: ['px'],
            default: "0",
            property: 'border-bottom-width',
        }, {
            name: 'Style',
            type: 'select',
            default: "none",
            property: 'border-bottom-style',
            options: [
                { value: 'none' },
                { value: 'solid' },
                { value: 'dotted' },
                { value: 'dashed' },
                { value: 'double' },
                { value: 'groove' },
                { value: 'ridge' },
                { value: 'inset' },
                { value: 'outset' }
            ]
        }, {
            name: 'Color',
            type: 'color',
            default: "black",
            property: 'border-bottom-color',
        }]
    });
}
