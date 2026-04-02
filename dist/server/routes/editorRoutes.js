"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var path_1 = require("path");
function addEditorRoutes(app) {
    var editor = express_1.default.Router();
    // Use process.cwd() for reliable path resolution
    // In production (standalone), serve from .next/standalone/editor
    // In development, serve from openscoreboard-editor/dist
    var isProd = process.env.NODE_ENV === 'production';
    var projectRoot = process.cwd();
    var editorPath = isProd
        ? path_1.default.join(projectRoot, '.next', 'standalone', 'editor')
        : path_1.default.join(projectRoot, 'openscoreboard-editor', 'dist');
    // Serve editor static files
    editor.use('/', express_1.default.static(editorPath));
    // SPA fallback - serve index.html for all editor routes
    editor.get('*', function (req, res) {
        res.sendFile(path_1.default.join(editorPath, 'index.html'));
    });
    app.use('/editor', editor);
}
exports.default = addEditorRoutes;
