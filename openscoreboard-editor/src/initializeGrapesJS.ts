import bgPlugin from 'grapesjs-style-bg';
import grapesjs from 'grapesjs';
import exportPlugin from 'grapesjs-plugin-export';
import basicBlocks from 'grapesjs-blocks-basic';
import { addServiceIconBlocks } from './plugins/addServiceIconBlocks';
import { loadFixedContainerBlocks } from './plugins/loadFixedContainerBlocks';
import { removeUnwantedButtons } from './plugins/removeUnwantedButtons';
import { addTopBarButtons } from './plugins/addTopBarButtons';
import { loadBorderStyles } from './plugins/loadBorderStyles';
import { loadAnimationStyles } from './plugins/loadAnimationStyles';
import { loadTextOverflowStyles } from './plugins/loadTextOverflowStyles';
import { textFieldList, currentGameFieldList, teamFieldList, solidColorFieldList, courtSideGameFieldList, imageFieldList } from './fieldLists';
import { addIsMatchOrGamePoint } from './plugins/addIsMatchOrGamePoint';
import { addFlagPenalties } from './plugins/addFlagPenalties';
import { addTimeOuts } from './plugins/addTimeOuts';
import { addCourtSideService } from './plugins/addCourtSideService';
import { addIsGameStartedFields } from './plugins/addIsGameStartedFields';
import { connectToLiveTTScoreboardDB } from './plugins/connectToLiveTTScoreboardDB';
import { loadImageBlocks } from './leftpanel/loadImageBlocks';
import { loadSolidColorBlocks } from './leftpanel/loadSolidColorBlocks';
import { loadTextBlocks } from './leftpanel/loadTextBlocks';
import { applyBlockIcons } from './blockIcons';
import { loadGoogleFonts } from './editorFonts';
import { installUnsavedChangesPrompt } from './plugins/installUnsavedChangesPrompt';

async function loadSavedScoreboardProject(editor: grapesjs.default.Editor) {
    try {
        const projectData = await editor.Storage.load();

        if (projectData && Object.keys(projectData).length > 0) {
            editor.loadProjectData(projectData);
        }

        editor.clearDirtyCount();
    } catch (error) {
        console.error("Failed to load saved scoreboard project", error);
    }
}

export function initializeGrapesJS(scoreboardID:string|null) {

    const plugins = [
        exportPlugin,
        bgPlugin,
        connectToLiveTTScoreboardDB,
        loadGoogleFonts,
        loadBorderStyles,
        loadTextOverflowStyles,
        loadAnimationStyles,
        removeUnwantedButtons,
        addTopBarButtons,
        loadFixedContainerBlocks,
        basicBlocks,
        addServiceIconBlocks,
        addIsMatchOrGamePoint,
        addFlagPenalties,
        addTimeOuts,
        addCourtSideService,
        addIsGameStartedFields
    ];

    const editor = grapesjs.init({
        container: '#gjs2',
        showOffsets: true,
        noticeOnUnload: 0,
        allowScripts: 1,
        fromElement: true,
        assetManager: {
            customFetch: async (url, options) => {
                try {
                    let response = await fetch(url, {
                        method: "POST",
                        body: options.body,
                        mode: "cors"
                    });
                    let data = await response.json();
                    if (data.error) {
                        alert(data.errorMessage);
                    }
                    else {
                        editor.AssetManager.add(data.data);
                    }
                } catch (error) {
                    alert("Failed To Upload Image");
                }
            },
            upload: import.meta.env.VITE_FILE_UPLOAD_PATH || false,
            autoAdd: true,
             embedAsBase64: import.meta.env.VITE_IS_LOCAL_DATABASE === "false" ? false : true,
            //  uploadFile
        },
        panels: {
            appendTo: "#top-panel"
        },
        blockManager: {
            appendTo: '#blocks'
        },
        styleManager: {
            appendTo: '#style-manager-container',
        },
        layerManager: {
            appendTo: '#layers-container'
        },
        storageManager: {
            type: "remote",
            options: {
                remote: { key: scoreboardID },
            },
            autoload: false,
            autosave: false
        },
        plugins,
        pluginsOpts: {
            [exportPlugin]: { /* options */ },
            [bgPlugin]: {},
            [basicBlocks]: {
                blocks: ["text", "image"]
            }
        }
    });

    window.openScoreboardEditor = editor;
    editor.UndoManager.start();
    installUnsavedChangesPrompt(editor);

    if (import.meta.env.DEV) {
        import('./templates')
            .then(({ default: loadTemplatesPlugin }) => loadTemplatesPlugin(editor))
            .catch((error) => console.error('Failed to load test scoreboard templates', error));
    }

    loadTextBlocks(editor, [...currentGameFieldList, ...textFieldList, ...teamFieldList, ...courtSideGameFieldList]);
    loadSolidColorBlocks(editor, [...solidColorFieldList]);
    loadImageBlocks(editor, [...imageFieldList]);
    applyBlockIcons(editor);


    editor.on("load", async () => {
        editor.Panels.removePanel("devices-c");
        await loadSavedScoreboardProject(editor);
        editor.on("asset:upload:response", (response) => {
            console.log(response);
        });
        const categories = editor.BlockManager.getCategories();
        categories.each(category => {
            category.set('open', false);

        });
    });
}
