import bgPlugin from 'grapesjs-style-bg';
import grapesjs from 'grapesjs';
import exportPlugin from 'grapesjs-plugin-export';
import basicBlocks from 'grapesjs-blocks-basic';
import { addServiceIconBlocks } from './plugins/addServiceIconBlocks';
import { loadFixedContainerBlocks } from './plugins/loadFixedContainerBlocks';
import { removeUnwantedButtons } from './plugins/removeUnwantedButtons';
import { addTopBarButtons } from './plugins/addTopBarButtons';
import { loadBorderStyles } from './plugins/loadBorderStyles';
import loadTemplatesPlugin from './templates';
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

export function initializeGrapesJS(scoreboardID:string|null) {

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
            //  embedAsBase64: true,
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
            autoload: true,
            autosave: false
        },
        plugins: [
           // loadTemplatesPlugin,
            exportPlugin,
            bgPlugin,
            connectToLiveTTScoreboardDB,
            loadBorderStyles,
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
        ],
        pluginsOpts: {
            [exportPlugin]: { /* options */ },
            [bgPlugin]: {},
            [basicBlocks]: {
                blocks: ["text", "image"]
            }
        }
    });

    editor.UndoManager.start();

    loadTextBlocks(editor, [...currentGameFieldList, ...textFieldList, ...teamFieldList, ...courtSideGameFieldList]);
    loadSolidColorBlocks(editor, [...solidColorFieldList]);
    loadImageBlocks(editor, [...imageFieldList]);


    editor.on("load", async () => {
        editor.Panels.removePanel("devices-c");
        editor.loadProjectData(await editor.Storage.load());
        editor.on("asset:upload:response", (response) => {
            console.log(response);
        });
        const categories = editor.BlockManager.getCategories();
        categories.each(category => {
            category.set('open', false);

        });
    });
}

