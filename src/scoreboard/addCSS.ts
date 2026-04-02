export const addCSS = (css: string) => {
    let newStyleTag = document.createElement("style");
    newStyleTag.id = "newstyle";
    document.head.appendChild(newStyleTag).innerHTML = css;
};
