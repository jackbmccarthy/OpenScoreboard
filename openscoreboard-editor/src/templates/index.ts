import { testScoreboardTemplates } from './testScoreboardTemplates';

const openTemplatesCommand = 'open-test-scoreboard-templates';

function injectTemplateStyles() {
    if (document.getElementById('osb-test-template-picker-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'osb-test-template-picker-styles';
    style.innerHTML = `
        .osb-template-picker {
            color: #151922;
            font-family: Arial, Helvetica, sans-serif;
            max-width: 860px;
            padding: 4px;
        }
        .osb-template-picker__header {
            margin-bottom: 16px;
        }
        .osb-template-picker__header h2 {
            font-size: 22px;
            margin: 0 0 6px;
        }
        .osb-template-picker__header p {
            color: #5b6475;
            font-size: 14px;
            line-height: 1.4;
            margin: 0;
        }
        .osb-template-picker__grid {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .osb-template-picker__item {
            background: #fff;
            border: 1px solid #dfe4ef;
            border-radius: 8px;
            cursor: pointer;
            padding: 14px;
            text-align: left;
            transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
            width: 100%;
        }
        .osb-template-picker__item:hover {
            border-color: #2d5bff;
            box-shadow: 0 8px 24px rgba(22, 34, 64, .14);
            transform: translateY(-1px);
        }
        .osb-template-picker__item strong {
            display: block;
            font-size: 15px;
            margin-bottom: 6px;
        }
        .osb-template-picker__item span {
            color: #5b6475;
            display: block;
            font-size: 13px;
            line-height: 1.35;
        }
    `;
    document.head.appendChild(style);
}

function loadTemplate(editor: grapesjs.default.Editor, templateId: string) {
    const template = testScoreboardTemplates.find((item) => item.id === templateId);

    if (!template) {
        return;
    }

    const shouldReplace = window.confirm(`Replace the current scoreboard with "${template.name}"?`);
    if (!shouldReplace) {
        return;
    }

    editor.setComponents(template.html);
    editor.setStyle(template.css);
    editor.UndoManager.clear();
    editor.Modal.close();
}

function renderTemplatePicker(editor: grapesjs.default.Editor) {
    injectTemplateStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'osb-template-picker';
    wrapper.innerHTML = `
        <div class="osb-template-picker__header">
            <h2>Test Scoreboard Templates</h2>
            <p>Load a category test board, then save it as any scoreboard to visually inspect live data, components, and animations.</p>
        </div>
        <div class="osb-template-picker__grid">
            ${testScoreboardTemplates.map((template) => `
                <button class="osb-template-picker__item" type="button" data-template-id="${template.id}">
                    <strong>${template.name}</strong>
                    <span>${template.description}</span>
                </button>
            `).join('')}
        </div>
    `;

    wrapper.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const button = target.closest<HTMLButtonElement>('[data-template-id]');
        const templateId = button?.dataset.templateId;

        if (templateId) {
            loadTemplate(editor, templateId);
        }
    });

    return wrapper;
}

export default function loadTemplatesPlugin(editor: grapesjs.default.Editor) {
    editor.Commands.add(openTemplatesCommand, {
        run(editor) {
            editor.Modal.open({
                content: renderTemplatePicker(editor),
                title: 'Templates',
            });
        },
    });
}

export { openTemplatesCommand };
