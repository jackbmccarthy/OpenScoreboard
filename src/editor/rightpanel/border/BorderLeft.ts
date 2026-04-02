export function BorderLeft(editor: grapesjs.default.Editor) {
    editor.StyleManager.addProperty('Borders', {
        name: 'Border Left',
        property: 'border-left',
        type: 'composite',
        properties: [{
            name: 'Width',
            type: 'integer',
            default: "0",
            units: ['px'],
            property: 'border-left-width',
        }, {
            name: 'Style',
            type: 'select',
            default: "none",
            property: 'border-left-style',
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
            property: 'border-left-color',
        }]
    });
}
