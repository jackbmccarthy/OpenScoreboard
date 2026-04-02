export function BorderTop(editor: grapesjs.default.Editor) {
    editor.StyleManager.addProperty('Borders', {
        name: 'Border Top',
        property: 'border-top',
        type: 'composite',
        properties: [{
            name: 'Width',
            type: 'integer',
            default: "0",
            units: ['px'],
            property: 'border-top-width',
        }, {
            name: 'Style',
            type: 'select',
            default: "none",
            property: 'border-top-style',
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
            property: 'border-top-color',
        }]
    });
}
