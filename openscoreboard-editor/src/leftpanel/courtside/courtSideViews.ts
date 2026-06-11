type CourtSideViewPreset = {
    id: string;
    label: string;
    side: "A" | "B";
};

const courtSideViewPresets: CourtSideViewPreset[] = [
    { id: "courtSideAView", label: "Court Side A View", side: "A" },
    { id: "courtSideBView", label: "Court Side B View", side: "B" },
];

function getCourtSideViewContent(preset: CourtSideViewPreset) {
    return {
        attributes: {
            class: preset.id,
            "data-osb-court-side-view": preset.side,
            title: `${preset.label}: drop side-specific fields inside this view to have them follow court-side switching.`,
        },
        style: {
            "align-items": "center",
            "background-color": "rgba(45, 91, 255, 0.12)",
            border: "2px dashed rgba(45, 91, 255, 0.65)",
            "box-sizing": "border-box",
            display: "flex",
            "flex-direction": "row",
            gap: "8px",
            height: "120px",
            "justify-content": "center",
            "min-height": "40px",
            "min-width": "80px",
            padding: "8px",
            position: "relative",
            width: "240px",
        },
        type: preset.id,
    };
}

export function courtSideViews(editor: grapesjs.default.Editor) {
    for (const preset of courtSideViewPresets) {
        editor.Components.addType(preset.id, {
            model: {
                defaults: {
                    attributes: {
                        class: preset.id,
                        "data-osb-court-side-view": preset.side,
                    },
                    dragMode: "absolute",
                    droppable: true,
                    resizable: true,
                    style: {
                        display: "flex",
                        "flex-direction": "row",
                    },
                },
            },
        });

        editor.BlockManager.add(preset.id, {
            category: "Court Side",
            content: getCourtSideViewContent(preset),
            label: preset.label,
        });
    }
}
