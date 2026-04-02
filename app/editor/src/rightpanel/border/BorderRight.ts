export function BorderRight(editor: grapesjs.default.Editor) {
    editor.StyleManager.addProperty('Borders', {
        name: 'Border right',
        property: 'border-right',
        type: 'composite',
        properties: [{
            name: 'Width',
            type: 'integer',
            default: "0",
            units: ['px',],
            property: 'border-right-width',
        }, {
            name: 'Style',
            type: 'select',
            default: "none",
            property: 'border-right-style',
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
            property: 'border-right-color',
        }]
    });
}
