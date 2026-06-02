import db from '../../database';
import { getEditorCssWithFontImports } from '../editorFonts';
import { repairLocalAceBaseNodeFromError } from '../repairLocalAceBaseNode';

type StorageOptions = {
    key?: string | null;
};

function hasSavedProjectData(data) {
    if (!data || typeof data !== "object") {
        return false;
    }

    if (data.projectData && typeof data.projectData === "object") {
        return hasSavedProjectData(data.projectData);
    }

    return ["pages", "styles", "assets", "symbols", "dataSources"].some((key) => {
        const value = data[key];

        return Array.isArray(value) ? value.length > 0 : typeof value !== "undefined";
    });
}

async function waitForDatabaseReady() {
    if (typeof db.ready === "function") {
        await db.ready();
    }
}

function getStorageKey(options: StorageOptions) {
    return typeof options?.key === "string" && options.key.length > 0 ? options.key : null;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

function shouldWriteLegacyConfig() {
    return import.meta.env.VITE_DISABLE_LEGACY_SCOREBOARD_CONFIG !== "true";
}

async function getWithRepair(path: string) {
    try {
        return await db.ref(path).get();
    }
    catch (error) {
        const repaired = await repairLocalAceBaseNodeFromError(error, path);

        if (!repaired) {
            throw error;
        }

        console.warn(`Repaired corrupt AceBase node "${path}". Retrying read.`);
        return await db.ref(path).get();
    }
}

async function setWithRepair(path: string, value) {
    try {
        return await db.ref(path).set(value);
    }
    catch (error) {
        const repaired = await repairLocalAceBaseNodeFromError(error, path);

        if (!repaired) {
            throw error;
        }

        console.warn(`Repaired corrupt AceBase node "${path}". Retrying write.`);
        return await db.ref(path).set(value);
    }
}

async function saveCanonicalWebProject(editor: grapesjs.default.Editor, scoreboardID: string, data) {
    await setWithRepair(`scoreboards/${scoreboardID}/web/html`, editor.getHtml());
    await setWithRepair(`scoreboards/${scoreboardID}/web/css`, getEditorCssWithFontImports(editor));
    await setWithRepair(`scoreboards/${scoreboardID}/web/javascript`, editor.getJs());
    await setWithRepair(`scoreboards/${scoreboardID}/web/projectData`, data);
}

async function recordStorageRepair(scoreboardID: string, source: string, error?: unknown) {
    try {
        await setWithRepair(`scoreboards/${scoreboardID}/web/repair`, {
            canonicalProjectPath: `scoreboards/${scoreboardID}/web/projectData`,
            legacyConfigPath: `scoreboards/${scoreboardID}/config`,
            legacyConfigRepairAttempted: true,
            repairedAt: new Date().toISOString(),
            source,
            reason: error ? getErrorMessage(error) : "Migrated editor storage to web/projectData",
        });
    }
    catch (repairError) {
        console.warn("Failed to write scoreboard storage repair marker.", repairError);
    }
}

export const connectToLiveTTScoreboardDB = (editor: grapesjs.default.Editor) => {
    editor.Storage.add('remote', {
        async load(options) {
            await waitForDatabaseReady();
            const scoreboardID = getStorageKey(options);

            if (!scoreboardID) {
                return {};
            }

            const webSnap = await getWithRepair(`scoreboards/${scoreboardID}/web`);
            const web = webSnap.val();

            if (hasSavedProjectData(web?.projectData)) {
                return web.projectData;
            }

            let projectData = null;
            try {
                const configSnap = await getWithRepair(`scoreboards/${scoreboardID}/config`);
                const config = configSnap.val();
                projectData = config?.projectData || config;
            }
            catch (error) {
                console.warn("Failed to load legacy scoreboard config. Falling back to web html/css.", error);
                await recordStorageRepair(scoreboardID, "legacy-config-load-error", error);
            }

            if (hasSavedProjectData(projectData)) {
                await setWithRepair(`scoreboards/${scoreboardID}/web/projectData`, projectData);
                await recordStorageRepair(scoreboardID, "legacy-config-migrated");
                return projectData;
            }

            if (web?.html || web?.css) {
                editor.setComponents(web.html || "");
                editor.setStyle(web.css || "");
                return editor.getProjectData();
            }

            return {};
        },

        async store(data, options) {
            await waitForDatabaseReady();
            const scoreboardID = getStorageKey(options);

            if (!scoreboardID) {
                return;
            }

            await saveCanonicalWebProject(editor, scoreboardID, data);
            if (!shouldWriteLegacyConfig()) {
                return;
            }

            try {
                return await setWithRepair(`scoreboards/${scoreboardID}/config`, data);
            }
            catch (error) {
                console.warn("Failed to save legacy scoreboard config. Keeping canonical editor project under web/projectData.", error);
                await recordStorageRepair(scoreboardID, "legacy-config-save-error", error);
            }
        }
    });
};
