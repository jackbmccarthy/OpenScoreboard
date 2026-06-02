type TimeOutTimerBlock = {
    blockId: string;
    field: string;
    label: string;
    sample: string;
    durationSeconds: string;
};

const timerBlocks: TimeOutTimerBlock[] = [
    {
        blockId: "timeOutTimerA60",
        field: "timeOutTimerA",
        label: "Time Out Timer A 60s",
        sample: "60",
        durationSeconds: "60",
    },
    {
        blockId: "timeOutTimerB60",
        field: "timeOutTimerB",
        label: "Time Out Timer B 60s",
        sample: "60",
        durationSeconds: "60",
    },
    {
        blockId: "timeOutTimer60",
        field: "timeOutTimer",
        label: "Time Out Timer 60s",
        sample: "60",
        durationSeconds: "60",
    },
    {
        blockId: "timeOutTimerA120",
        field: "timeOutTimerA",
        label: "Time Out Timer A 120s",
        sample: "120",
        durationSeconds: "120",
    },
    {
        blockId: "timeOutTimerB120",
        field: "timeOutTimerB",
        label: "Time Out Timer B 120s",
        sample: "120",
        durationSeconds: "120",
    },
    {
        blockId: "timeOutTimer120",
        field: "timeOutTimer",
        label: "Time Out Timer 120s",
        sample: "120",
        durationSeconds: "120",
    },
];

const timerFields = new Set(timerBlocks.map((block) => block.field));

function addTimeOutTimerType(editor: grapesjs.default.Editor, field: string) {
    editor.Components.addType(field, {
        model: {
            defaults: {
                components: "60",
                style: {
                    flex: 1,
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    "justify-content": "center",
                    "align-items": "center",
                },
                dragMode: "absolute",
                resizable: true,
                attributes: {
                    class: field,
                    "data-timeout-duration": "60",
                },
                traits: [
                    {
                        type: "number",
                        name: "data-timeout-duration",
                        label: "Duration Seconds",
                        min: 1,
                    },
                ],
            },
        },
    });
}

export function addTimeOutTimerBlocks(editor: grapesjs.default.Editor) {
    timerFields.forEach((field) => addTimeOutTimerType(editor, field));

    timerBlocks.forEach((block) => {
        editor.BlockManager.add(block.blockId, {
            label: block.label,
            attributes: { class: "fa fa-text" },
            content: {
                type: block.field,
                components: block.sample,
                attributes: {
                    class: block.field,
                    "data-timeout-duration": block.durationSeconds,
                },
            },
            category: "Time Outs",
        });
    });
}
