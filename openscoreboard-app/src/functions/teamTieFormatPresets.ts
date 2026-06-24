import db, { getUserPath } from '../../database';
import { normalizeTeamTieFormat } from './teamTieFormats';

function cleanPresetName(name = "") {
    return `${name || ""}`.trim().slice(0, 80);
}

export async function getTeamTieFormatPresets() {
    const userID = getUserPath();
    const [presetsSnapshot, defaultIDSnapshot] = await Promise.all([
        db.ref(`users/${userID}/teamTieFormatPresets`).get(),
        db.ref(`users/${userID}/defaultTeamTieFormatPresetID`).get(),
    ]);
    const presetsValue = presetsSnapshot.val() || {};
    const presets = Object.entries(presetsValue)
        .map(([id, preset]: any) => ({
            ...preset,
            format: normalizeTeamTieFormat(preset?.format),
            id,
        }))
        .sort((firstPreset, secondPreset) => `${firstPreset.name || ""}`.localeCompare(`${secondPreset.name || ""}`));

    return {
        defaultID: defaultIDSnapshot.val() || "",
        presets,
    };
}

export async function getDefaultTeamTieFormatPreset() {
    const { defaultID, presets } = await getTeamTieFormatPresets();
    return presets.find((preset) => preset.id === defaultID) || null;
}

export async function saveTeamTieFormatPreset({ format, name, presetID = "" }) {
    const userID = getUserPath();
    const cleanName = cleanPresetName(name);
    if (!cleanName) {
        throw new Error("Enter a name for this team tie preset.");
    }

    const presetRef = presetID ?
        db.ref(`users/${userID}/teamTieFormatPresets/${presetID}`)
        : db.ref(`users/${userID}/teamTieFormatPresets`).push();
    const currentSnapshot = presetID ? await presetRef.get() : null;
    const currentPreset = currentSnapshot?.val() || {};
    const timestamp = new Date().toISOString();
    const preset = {
        createdOn: currentPreset.createdOn || timestamp,
        format: normalizeTeamTieFormat(format),
        name: cleanName,
        updatedOn: timestamp,
    };

    await presetRef.set(preset);
    return {
        ...preset,
        id: presetRef.key,
    };
}

export async function setDefaultTeamTieFormatPreset(presetID) {
    const userID = getUserPath();
    await db.ref(`users/${userID}/defaultTeamTieFormatPresetID`).set(presetID || "");
}

export async function deleteTeamTieFormatPreset(presetID) {
    if (!presetID) {
        return;
    }

    const userID = getUserPath();
    const defaultIDSnapshot = await db.ref(`users/${userID}/defaultTeamTieFormatPresetID`).get();
    await db.ref(`users/${userID}/teamTieFormatPresets/${presetID}`).remove();

    if (defaultIDSnapshot.val() === presetID) {
        await db.ref(`users/${userID}/defaultTeamTieFormatPresetID`).set("");
    }
}
