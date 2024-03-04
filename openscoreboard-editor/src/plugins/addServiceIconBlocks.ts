//import { isLocalServer } from './livettscoreboard.config';
//import EventEmitter from 'events';
//const matchID = "ld5ak8t2001v3b6cxbh1ccd2";
//const scoreboardID = "123456";
//let matchListener = new EventEmitter();
//import defaultServiceIconSVG from '../images/serviceicon1.svg';

import { SecondServerIconA } from "../leftpanel/service/SecondServerIconA";
import { SecondServerIconB } from "../leftpanel/service/SecondServerIconB";
import { customServiceIconA } from "../leftpanel/service/customServiceIconA";
import { customServiceIconB } from "../leftpanel/service/customServiceIconB";

export function addServiceIconBlocks(editor: grapesjs.default.Editor) {

    customServiceIconA(editor)
    customServiceIconB(editor)
    SecondServerIconA(editor)
    SecondServerIconB(editor)
}

