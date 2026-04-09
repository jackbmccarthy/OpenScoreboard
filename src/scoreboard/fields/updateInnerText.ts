//Keep This File Synced with /editor's Field List file too.

export const updateInnerText = (matchNode: HTMLElement, value: string | number) => {
    matchNode.innerText = String(value)
}
