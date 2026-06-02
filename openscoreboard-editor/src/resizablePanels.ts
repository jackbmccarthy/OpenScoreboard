type PanelKey = "layers" | "styleManager" | "topPanel";

type PanelConfig = {
    cssVariable: string;
    defaultSize: number;
    minSize: number;
    maxSize: number;
};

const STORAGE_KEY = "openscoreboard.editor.panelSizes";
const MIN_CANVAS_WIDTH = 420;
const MIN_CANVAS_HEIGHT = 300;

const PANEL_CONFIGS: Record<PanelKey, PanelConfig> = {
    layers: {
        cssVariable: "--editor-left-panel-width",
        defaultSize: 320,
        minSize: 220,
        maxSize: 560,
    },
    styleManager: {
        cssVariable: "--editor-right-panel-width",
        defaultSize: 300,
        minSize: 240,
        maxSize: 520,
    },
    topPanel: {
        cssVariable: "--editor-top-panel-height",
        defaultSize: 48,
        minSize: 40,
        maxSize: 140,
    },
};

function getStoredPanelSizes(): Partial<Record<PanelKey, number>> {
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    }
    catch {
        return {};
    }
}

function storePanelSize(panel: PanelKey, size: number) {
    const storedSizes = getStoredPanelSizes();
    storedSizes[panel] = size;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSizes));
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

function getPanelSize(panel: PanelKey) {
    const config = PANEL_CONFIGS[panel];
    const rawValue = getComputedStyle(document.documentElement).getPropertyValue(config.cssVariable);
    const parsedValue = parseFloat(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : config.defaultSize;
}

function getDynamicMaxSize(panel: PanelKey) {
    const config = PANEL_CONFIGS[panel];

    if (panel === "layers") {
        const rightPanelWidth = getPanelSize("styleManager");
        return Math.min(config.maxSize, window.innerWidth - rightPanelWidth - MIN_CANVAS_WIDTH);
    }

    if (panel === "styleManager") {
        const leftPanelWidth = getPanelSize("layers");
        return Math.min(config.maxSize, window.innerWidth - leftPanelWidth - MIN_CANVAS_WIDTH);
    }

    return Math.min(config.maxSize, window.innerHeight - MIN_CANVAS_HEIGHT);
}

function setPanelSize(panel: PanelKey, size: number, persist = true, notify = true) {
    const config = PANEL_CONFIGS[panel];
    const nextSize = clamp(size, config.minSize, Math.max(config.minSize, getDynamicMaxSize(panel)));
    document.documentElement.style.setProperty(config.cssVariable, `${nextSize}px`);

    if (persist) {
        storePanelSize(panel, nextSize);
    }

    if (notify) {
        window.dispatchEvent(new Event("resize"));
    }
}

function restorePanelSizes() {
    const storedSizes = getStoredPanelSizes();

    (Object.keys(PANEL_CONFIGS) as PanelKey[]).forEach((panel) => {
        setPanelSize(panel, storedSizes[panel] || PANEL_CONFIGS[panel].defaultSize, false, false);
    });
}

function getDragDelta(event: PointerEvent, axis: string, startX: number, startY: number) {
    return axis === "y" ? event.clientY - startY : event.clientX - startX;
}

export function initializeResizablePanels() {
    restorePanelSizes();

    const handles = Array.from(document.querySelectorAll<HTMLElement>("[data-panel-resizer]"));

    handles.forEach((handle) => {
        handle.addEventListener("dblclick", () => {
            const panel = handle.dataset.panel as PanelKey;
            if (!panel || !PANEL_CONFIGS[panel]) {
                return;
            }

            setPanelSize(panel, PANEL_CONFIGS[panel].defaultSize);
        });

        handle.addEventListener("pointerdown", (event) => {
            const panel = handle.dataset.panel as PanelKey;
            const axis = handle.dataset.axis || "x";
            const edge = handle.dataset.edge || "end";

            if (!panel || !PANEL_CONFIGS[panel]) {
                return;
            }

            event.preventDefault();
            handle.setPointerCapture(event.pointerId);

            const startX = event.clientX;
            const startY = event.clientY;
            const startSize = getPanelSize(panel);
            const cursorClass = axis === "y" ? "editor-resizing-row" : "editor-resizing-column";

            document.body.classList.add("editor-resizing", cursorClass);
            handle.classList.add("panel-resizer-active");

            const onPointerMove = (moveEvent: PointerEvent) => {
                const delta = getDragDelta(moveEvent, axis, startX, startY);
                const direction = edge === "start" ? -1 : 1;
                setPanelSize(panel, startSize + (delta * direction), false);
            };

            const stopResizing = (upEvent: PointerEvent) => {
                storePanelSize(panel, getPanelSize(panel));
                document.body.classList.remove("editor-resizing", cursorClass);
                handle.classList.remove("panel-resizer-active");
                if (handle.hasPointerCapture(upEvent.pointerId)) {
                    handle.releasePointerCapture(upEvent.pointerId);
                }
                window.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerup", stopResizing);
                window.removeEventListener("pointercancel", stopResizing);
            };

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", stopResizing);
            window.addEventListener("pointercancel", stopResizing);
        });
    });

    window.addEventListener("resize", () => {
        (Object.keys(PANEL_CONFIGS) as PanelKey[]).forEach((panel) => {
            setPanelSize(panel, getPanelSize(panel), false, false);
        });
    });
}
