type AspectRatioPreset = {
    description: string;
    height: number;
    id: string;
    label: string;
    width: number;
};

const aspectRatioPresets: AspectRatioPreset[] = [
    { id: 'aspectRatio16x9', label: '16:9 Widescreen', description: 'TV / HD', width: 16, height: 9 },
    { id: 'aspectRatio9x16', label: '9:16 Portrait', description: 'Vertical screen', width: 9, height: 16 },
    { id: 'aspectRatio16x10', label: '16:10 Monitor', description: 'Laptop / monitor', width: 16, height: 10 },
    { id: 'aspectRatio10x16', label: '10:16 Portrait', description: 'Portrait monitor', width: 10, height: 16 },
    { id: 'aspectRatio4x3', label: '4:3 Standard', description: 'Classic display', width: 4, height: 3 },
    { id: 'aspectRatio3x4', label: '3:4 Portrait', description: 'Classic portrait', width: 3, height: 4 },
    { id: 'aspectRatio3x2', label: '3:2 Photo', description: 'Camera / tablet', width: 3, height: 2 },
    { id: 'aspectRatio2x3', label: '2:3 Portrait', description: 'Portrait photo', width: 2, height: 3 },
    { id: 'aspectRatio5x4', label: '5:4 Display', description: 'Older monitor', width: 5, height: 4 },
    { id: 'aspectRatio4x5', label: '4:5 Portrait', description: 'Social portrait', width: 4, height: 5 },
    { id: 'aspectRatio1x1', label: '1:1 Square', description: 'Square frame', width: 1, height: 1 },
    { id: 'aspectRatio21x9', label: '21:9 Ultrawide', description: 'Cinema / ultrawide', width: 21, height: 9 },
    { id: 'aspectRatio9x21', label: '9:21 Portrait', description: 'Tall ultrawide', width: 9, height: 21 },
    { id: 'aspectRatio32x9', label: '32:9 Super Ultrawide', description: 'Super ultrawide', width: 32, height: 9 },
    { id: 'aspectRatio9x32', label: '9:32 Super Portrait', description: 'Tall signage', width: 9, height: 32 },
];

function getDefaultWidth(width: number, height: number) {
    if (width === height) {
        return '480px';
    }

    return width > height ? '640px' : '320px';
}

function getAspectRatioContent(preset: AspectRatioPreset) {
    return {
        attributes: {
            'data-aspect-ratio': `${preset.width}:${preset.height}`,
            title: `${preset.label} aspect ratio container`,
        },
        classes: ['aspectRatioContainer', preset.id],
        style: {
            'align-items': 'center',
            'aspect-ratio': `${preset.width} / ${preset.height}`,
            'background-color': '#c7c7c76e',
            border: '2px dashed rgba(45, 91, 255, 0.55)',
            'box-sizing': 'border-box',
            display: 'flex',
            'flex-direction': 'column',
            gap: '8px',
            height: 'auto',
            'justify-content': 'center',
            'min-width': '80px',
            overflow: 'hidden',
            position: 'relative',
            width: getDefaultWidth(preset.width, preset.height),
        },
        type: 'aspectRatioContainer',
    };
}

export function aspectRatioContainers(editor: grapesjs.default.Editor) {
    editor.Components.addType('aspectRatioContainer', {
        model: {
            defaults: {
                dragMode: 'absolute',
                droppable: true,
                resizable: {
                    bc: 0,
                    bl: 0,
                    br: 0,
                    cl: 1,
                    cr: 1,
                    keyWidth: 'width',
                    tc: 0,
                    tl: 0,
                    tr: 0,
                },
                style: {
                    'aspect-ratio': '16 / 9',
                    height: 'auto',
                },
            },
            init() {
                this.on('change:style', this.keepAspectRatio);
            },
            keepAspectRatio() {
                const style = this.getStyle();

                if (style.height && style.height !== 'auto') {
                    this.addStyle({ height: 'auto' });
                }
            },
        },
    });

    for (const preset of aspectRatioPresets) {
        editor.BlockManager.add(preset.id, {
            category: 'Aspect Ratio Containers',
            content: getAspectRatioContent(preset),
            label: `${preset.label} ${preset.description}`,
        });
    }
}
