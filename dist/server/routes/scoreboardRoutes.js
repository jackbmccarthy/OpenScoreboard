"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var path_1 = require("path");
function addScoreboardRoutes(app) {
    var scoreboard = express_1.default.Router();
    // Use process.cwd() for reliable path resolution
    // In production (standalone), serve from .next/standalone/scoreboard
    // In development, serve from openscoreboard-scoreboard/dist
    var isProd = process.env.NODE_ENV === 'production';
    var projectRoot = process.cwd();
    var scoreboardPath = isProd
        ? path_1.default.join(projectRoot, '.next', 'standalone', 'scoreboard')
        : path_1.default.join(projectRoot, 'openscoreboard-scoreboard', 'dist');
    // Serve scoreboard static files
    scoreboard.use('/', express_1.default.static(scoreboardPath));
    // SPA fallback - serve index.html for all scoreboard routes
    scoreboard.get('*', function (req, res) {
        res.sendFile(path_1.default.join(scoreboardPath, 'index.html'));
    });
    app.use('/scoreboard', scoreboard);
}
exports.default = addScoreboardRoutes;
