const CORRUPT_RECORD_PATH_PATTERN = /while reading record at "\/([^"]+)"/i;

function getAceBaseCorruptRecordPath(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(CORRUPT_RECORD_PATH_PATTERN);

    return match?.[1] || null;
}

function getAceBaseServerOrigin() {
    const port = process.env.NODE_ENV === "production" ? window.location.port : "8080";
    return `${window.location.protocol}//${window.location.hostname}${port ? `:${port}` : ""}`;
}

async function repairLocalAceBaseNode(path: string) {
    if (import.meta.env.VITE_IS_LOCAL_DATABASE === "false") {
        return false;
    }

    const response = await fetch(`${getAceBaseServerOrigin()}/maintenance/repair-node`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            path,
            markAsRemoved: false,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Failed to repair AceBase node "${path}": ${message}`);
    }

    return true;
}

export async function getWithAceBaseRepair(db, path: string) {
    try {
        return await db.ref(path).get();
    }
    catch (error) {
        const repairPath = getAceBaseCorruptRecordPath(error) || path.replace(/^\/+/, "");

        await repairLocalAceBaseNode(repairPath);
        console.warn(`Repaired corrupt AceBase node "${repairPath}". Retrying read.`);

        return await db.ref(path).get();
    }
}
