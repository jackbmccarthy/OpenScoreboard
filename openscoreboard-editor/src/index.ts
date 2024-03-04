//import '../styles/index.scss';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapick/dist/grapick.min.css';

import { initializeGrapesJS } from './initializeGrapesJS';
const params = new URLSearchParams(window.location.search);
if (params.get("t") === "editor" && params.get("sid") !== null) {
    let scoreboardID = params.get("sid");
    initializeGrapesJS(scoreboardID);
}


