import CryptoJS from  'crypto-js'
import { getEditorCssWithFontImports } from '../editorFonts';

const TOP_BAR_ICONS = {
    download: `
        <path d="M12 3v10"></path>
        <path d="m7 9 5 5 5-5"></path>
        <path d="M5 19h14"></path>
    `,
    fileDown: `
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M12 11v7"></path>
        <path d="m9 15 3 3 3-3"></path>
    `,
    fileUp: `
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M12 18v-7"></path>
        <path d="m9 14 3-3 3 3"></path>
    `,
    font: `
        <path d="M5 20h3"></path>
        <path d="M14 20h5"></path>
        <path d="m6 16 5-12 5 12"></path>
        <path d="M8 11h8"></path>
    `,
    redo: `
        <path d="m15 14 4-4-4-4"></path>
        <path d="M19 10H9a5 5 0 0 0 0 10h1"></path>
    `,
    save: `
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2z"></path>
        <path d="M7 3v6h10"></path>
        <path d="M7 21v-8h10v8"></path>
    `,
    template: `
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <path d="M3 9h18"></path>
        <path d="M9 21V9"></path>
    `,
    undo: `
        <path d="m9 14-4-4 4-4"></path>
        <path d="M5 10h10a5 5 0 0 1 0 10h-1"></path>
    `,
};

function topBarButtonLabel(iconName: keyof typeof TOP_BAR_ICONS, label: string) {
    return `
        <span class="osb-topbar-button">
            <span class="osb-topbar-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${TOP_BAR_ICONS[iconName]}
                </svg>
            </span>
            <span class="osb-topbar-button__label">${label}</span>
        </span>
    `;
}

function hasSavedProjectData(data) {
    if (!data || typeof data !== "object") {
        return false;
    }

    return ["pages", "styles", "assets", "symbols", "dataSources"].some((key) => {
        const value = data[key];

        return Array.isArray(value) ? value.length > 0 : typeof value !== "undefined";
    });
}

function getProjectDataFromImport(importData) {
    if (hasSavedProjectData(importData?.projectData)) {
        return importData.projectData;
    }

    if (hasSavedProjectData(importData)) {
        return importData;
    }

    return null;
}

function normalizeImportedHtmlAndCss(html = "", css = "") {
    if (!html || typeof DOMParser === "undefined") {
        return { html, css };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const embeddedCss = Array.from(doc.querySelectorAll("style"))
        .map((styleTag) => styleTag.textContent || "")
        .join("\n");

    doc.querySelectorAll("style").forEach((styleTag) => styleTag.remove());

    return {
        html: doc.body?.innerHTML || html,
        css: [embeddedCss, css].filter(Boolean).join("\n"),
    };
}

function importHtmlAndCssAsProject(editor, html = "", css = "") {
    const normalizedImport = normalizeImportedHtmlAndCss(html, css);

    editor.setComponents(normalizedImport.html);
    editor.setStyle(normalizedImport.css);

    // GrapesJS can only save a compatible editor project after it parses
    // imported markup into its component/style model.
    editor.loadProjectData(editor.getProjectData());
}

function importScoreboardData(editor, importData) {
    const projectData = getProjectDataFromImport(importData);

    if (projectData) {
        editor.loadProjectData(projectData);
        return;
    }

    if (typeof importData?.html === "string" || typeof importData?.css === "string") {
        importHtmlAndCssAsProject(editor, importData.html || "", importData.css || "");
        return;
    }

    throw new Error("Imported file does not contain projectData or html/css.");
}

async function saveEditorProject(editor) {
    await editor.StorageManager.store(editor.getProjectData(), editor.StorageManager.getStorageOptions());
    editor.clearDirtyCount();
}

export function addTopBarButtons(editor) {
    const toolbarButtonClass = "osb-topbar-command";
    let panelConfig = {
        appendTo: "#toppanel",
        id: "editing", visible: true, buttons: [
            {
                id: "undo-button", className: toolbarButtonClass, label: topBarButtonLabel("undo", "Undo"), command: {
                    run: function (editor) {
                        if (editor.UndoManager.hasUndo()) {
                            editor.UndoManager.undo();
                        }
                    }
                },
            },
            {
                id: "redo-button", className: toolbarButtonClass, label: topBarButtonLabel("redo", "Redo"), command: {
                    run: function (editor) {
                        if (editor.UndoManager.hasRedo()) {
                            editor.UndoManager.redo();
                        }
                    }
                },
            },
            {
                id: "fontsButton", className: toolbarButtonClass, label: topBarButtonLabel("font", "Fonts"), command: {
                    run: function (editor) {
                        editor.runCommand("open-fonts");
                    }
                }
            },
            {
                id: "saveButton", className: `${toolbarButtonClass} osb-topbar-command--primary`, label: topBarButtonLabel("save", "Save"), command: {
                    run: async function (editor) {
                        await saveEditorProject(editor);
                        alert("Scoreboard Saved!");
                    }
                }
            },
            {
                id: "exportButton", className: `${toolbarButtonClass} osb-topbar-command--light`, label: topBarButtonLabel("fileDown", "Export"), command: {
                    run: async function (editor) {
                        const password = prompt("Please enter a password for the file.")
                        const exportData = {
                            projectData: editor.getProjectData(),
                            html: editor.getHtml(),
                            css: getEditorCssWithFontImports(editor),
                        }
                        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(exportData), password).toString()
                        const element = document.createElement("a");
                        const file = new Blob([encryptedData], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = "myScoreboard.opensb";

                        document.body.appendChild(element); // Required for this to work in FireFox
                        element.click();
                      
                        await saveEditorProject(editor);
                    }
                }
            },
            {
                id: "importButton", className: `${toolbarButtonClass} osb-topbar-command--primary`, label: topBarButtonLabel("fileUp", "Import"), command: {
                    run: async function (editor) {
                        const fileInput = document.createElement('input');
                        fileInput.style="display:none;"
                        fileInput.type = 'file';
                        fileInput.onchange = function(event) {
                          const file = event.target.files[0];
                          const fileReader = new FileReader();
                          fileReader.onload = function() {
                            try {
                                const fileContents = fileReader.result;
                                const password = prompt("Password for the file:")
                                const decryptedFile = CryptoJS.AES.decrypt(fileContents,password).toString(CryptoJS.enc.Utf8)
                                const importData = JSON.parse(decryptedFile);

                                importScoreboardData(editor, importData);
                                editor.UndoManager.clear();
                                alert("Scoreboard imported. Press Save to persist changes.");
                            } catch (error) {
                                console.error("Unable to import scoreboard file", error);
                                alert("Unable to upload the file, please check and make you have the correct file and password.")
                            }
                          }
                          fileReader.readAsText(file);

                        }
                        document.body.appendChild(fileInput);
                        fileInput.click()
                    }
                }
            },
        ]
    }
    if (import.meta.env.DEV) {
        panelConfig.buttons.splice(3, 0, {
            id: "templatesButton", className: `${toolbarButtonClass} osb-topbar-command--accent`, label: topBarButtonLabel("template", "Templates"), command: {
                run: function (editor) {
                    editor.runCommand("open-test-scoreboard-templates");
                }
            }
        });
    }
    if(import.meta.env.DEV){
        panelConfig.buttons.push(
            {
                id: "getTemplate", className: `${toolbarButtonClass} osb-topbar-command--light`, label: topBarButtonLabel("download", "Get Template"), command: {
                    run: async function (editor) {
                       // const password = prompt("Please enter a password for the file.")
                        const exportData = {
                            projectData: editor.getProjectData(),
                            html: editor.getHtml(),
                            css: getEditorCssWithFontImports(editor),
                        }
                       // console.log(exportData)
                        //const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(exportData), password).toString()

                        const element = document.createElement("a");

                        let components = editor.getComponents();
      let style = editor.getStyle()
      let templateData = {
         components: components,
         style: style
      };

                      //  const file = new Blob([JSON.stringify(exportData.projectData["pages"][0]["frames"][0]["component"]["components"][0])], { type: 'application/json' });
                        const file = new Blob([JSON.stringify(templateData)], { type: 'application/json' });

                        element.href = URL.createObjectURL(file);
                        element.download = "myTemplate.json";

                        document.body.appendChild(element); // Required for this to work in FireFox
                        element.click();
                      
                        await saveEditorProject(editor);
                    }
                }
            },
        )
    }
    editor.Panels.addPanel(
        panelConfig
    );
}
