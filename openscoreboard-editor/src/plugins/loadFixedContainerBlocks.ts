import { aspectRatioContainers } from "../leftpanel/container/aspectRatioContainers";
import { columnContainer } from "../leftpanel/container/columnContainer";
import { rowContainer } from "../leftpanel/container/rowContainer";

export function loadFixedContainerBlocks(editor:grapesjs.default.Editor) {
    rowContainer(editor)
    columnContainer(editor)
    aspectRatioContainers(editor)



}
