export function getTimestampValue(...dateValues: any[]) {
    for (const dateValue of dateValues) {
        const parsedDate = Date.parse(dateValue || "");
        if (!Number.isNaN(parsedDate)) {
            return parsedDate;
        }
    }

    return 0;
}

export function getEntryKey(entry: any) {
    return `${entry?.[0] || entry?.[1]?.id || entry?.myTableID || entry?.myID || entry?.id || ""}`;
}

export function compareByCreatedDesc(firstEntry: any, secondEntry: any, getRecord = (entry: any) => entry?.[1] || entry || {}) {
    const firstRecord = getRecord(firstEntry) || {};
    const secondRecord = getRecord(secondEntry) || {};
    const firstCreated = getTimestampValue(firstRecord.createdOn, firstRecord.createdAt, firstRecord.dateCreated);
    const secondCreated = getTimestampValue(secondRecord.createdOn, secondRecord.createdAt, secondRecord.dateCreated);

    if (firstCreated !== secondCreated) {
        return secondCreated - firstCreated;
    }

    return getEntryKey(secondEntry).localeCompare(getEntryKey(firstEntry));
}
