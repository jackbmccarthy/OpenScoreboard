export function getOptionalImageSource(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

export function setOptionalImageSource(element: HTMLImageElement, value: unknown) {
    const src = getOptionalImageSource(value);

    if (!src || src === "0") {
        element.removeAttribute("src");
        element.style.display = "none";
        return;
    }

    element.src = src;
    element.style.display = "";
}

export function hasPairedPlayerImages(playerA: any = {}, playerB: any = {}) {
    const imageURLA = getOptionalImageSource(playerA?.imageURL);
    const imageURLB = getOptionalImageSource(playerB?.imageURL);

    return !!imageURLA && imageURLA !== "0" && !!imageURLB && imageURLB !== "0";
}

export function setPairedPlayerImageSources(root: ParentNode, playerA: any = {}, playerB: any = {}) {
    const canShowImages = hasPairedPlayerImages(playerA, playerB);
    const imageURLA = canShowImages ? playerA?.imageURL : "";
    const imageURLB = canShowImages ? playerB?.imageURL : "";

    root.querySelectorAll<HTMLImageElement>(".imageURLA").forEach((element) => {
        setOptionalImageSource(element, imageURLA);
    });
    root.querySelectorAll<HTMLImageElement>(".imageURLB").forEach((element) => {
        setOptionalImageSource(element, imageURLB);
    });
}

export function hideEmptyImages(root: ParentNode) {
    root.querySelectorAll<HTMLImageElement>("img").forEach((element) => {
        setOptionalImageSource(element, element.getAttribute("src"));
    });
}
