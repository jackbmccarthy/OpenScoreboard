const TEXT_OVERFLOW_PRESETS = {
    wrap: {
        "white-space": "normal",
        overflow: "visible",
        "text-overflow": "clip",
        "overflow-wrap": "normal",
        "word-break": "normal",
        "min-width": "0",
        "max-width": "none",
    },
    wrapAnywhere: {
        "white-space": "normal",
        overflow: "visible",
        "text-overflow": "clip",
        "overflow-wrap": "anywhere",
        "word-break": "normal",
        "min-width": "0",
        "max-width": "none",
    },
    ellipsis: {
        "white-space": "nowrap",
        overflow: "hidden",
        "text-overflow": "ellipsis",
        "overflow-wrap": "normal",
        "word-break": "normal",
        "min-width": "0",
        "max-width": "100%",
    },
};

const TEXT_OVERFLOW_CLEAR_STYLES = {
    "white-space": "",
    overflow: "",
    "text-overflow": "",
    "overflow-wrap": "",
    "word-break": "",
    "min-width": "",
    "max-width": "",
};

function getStyleValue(style, property) {
    return style?.[property] || "";
}

function getSelectedTextOverflowPreset(editor: grapesjs.default.Editor) {
    const selected = editor.getSelected();
    const style = selected?.getStyle() || {};
    const whiteSpace = getStyleValue(style, "white-space");
    const textOverflow = getStyleValue(style, "text-overflow");
    const overflowWrap = getStyleValue(style, "overflow-wrap");

    if (whiteSpace === "nowrap" && textOverflow === "ellipsis") {
        return "ellipsis";
    }

    if (whiteSpace === "normal" && overflowWrap === "anywhere") {
        return "wrapAnywhere";
    }

    if (whiteSpace === "normal") {
        return "wrap";
    }

    return "";
}

function createPresetSelect(change) {
    const field = document.createElement("div");
    field.className = "gjs-field gjs-select";

    const select = document.createElement("select");
    select.innerHTML = `
        <option value="">Default</option>
        <option value="wrap">Wrap at spaces</option>
        <option value="wrapAnywhere">Wrap long names</option>
        <option value="ellipsis">Single-line ellipsis</option>
    `;
    select.addEventListener("change", (event) => change({ event }));

    field.appendChild(select);
    return field;
}

function mergeStyles(existingStyle, styleUpdate) {
    const nextStyle = { ...existingStyle };

    Object.entries(styleUpdate).forEach(([property, value]) => {
        if (value === "") {
            delete nextStyle[property];
        }
        else {
            nextStyle[property] = value;
        }
    });

    return nextStyle;
}

function applyTextOverflowPreset(editor: grapesjs.default.Editor, value) {
    const styleUpdate = TEXT_OVERFLOW_PRESETS[value] || TEXT_OVERFLOW_CLEAR_STYLES;
    const selectedComponents = typeof editor.getSelectedAll === "function"
        ? editor.getSelectedAll()
        : [editor.getSelected()].filter(Boolean);

    selectedComponents.forEach((component) => {
        component.setStyle(mergeStyles(component.getStyle(), styleUpdate));
    });

    return styleUpdate;
}

export function loadTextOverflowStyles(editor: grapesjs.default.Editor) {
    editor.StyleManager.addType("osb-text-overflow-preset", {
        create({ change }) {
            return createPresetSelect(change);
        },
        emit({ updateStyle }, { event, partial }) {
            const value = event?.target?.value;
            const styleUpdate = applyTextOverflowPreset(editor, value);

            updateStyle(styleUpdate, { partial });
        },
        update({ el }) {
            const select = el.querySelector("select");

            if (select) {
                select.value = getSelectedTextOverflowPreset(editor);
            }
        },
        unset({ updateStyle }) {
            updateStyle(TEXT_OVERFLOW_CLEAR_STYLES);
        },
    });

    editor.on("load", () => {
        if (editor.StyleManager.getProperty("typography", "osb-text-overflow-preset")) {
            return;
        }

        const typographySector = editor.StyleManager.getSector("typography")
            || editor.StyleManager.addSector("typography", {
                name: "Typography",
                open: false,
            });

        typographySector.addProperty({
            id: "osb-text-overflow-preset",
            name: "Text Overflow",
            property: "osb-text-overflow-preset",
            type: "osb-text-overflow-preset",
            full: true,
            info: "Choose whether text wraps into available vertical space or clips with an ellipsis.",
        });
    });
}
