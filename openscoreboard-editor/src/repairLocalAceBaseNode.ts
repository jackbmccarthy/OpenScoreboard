const CORRUPT_RECORD_PATH_PATTERN = /while reading record at "\/([^"]+)"/i;

export function getAceBaseCorruptRecordPath(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(CORRUPT_RECORD_PATH_PATTERN);

    return match?.[1] || null;
}

function getAceBaseServerOrigin() {
    const port = process.env.NODE_ENV === "production" ? window.location.port : "8080";
    return `${window.location.protocol}//${window.location.hostname}${port ? `:${port}` : ""}`;
}

export async function repairLocalAceBaseNode(path: string, markAsRemoved = false) {
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
            markAsRemoved,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Failed to repair AceBase node "${path}": ${message}`);
    }

    return true;
}

export async function repairLocalAceBaseNodeFromError(error: unknown, fallbackPath?: string) {
    const repairPath = getAceBaseCorruptRecordPath(error) || fallbackPath;

    if (!repairPath) {
        return false;
    }

    await repairLocalAceBaseNode(repairPath, false);
    return true;
}
