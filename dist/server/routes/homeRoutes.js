"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
function addHomeRoutes(app) {
    var homeRoute = express_1.default.Router();
    // Redirect root to /app
    homeRoute.get('/', function (req, res) {
        res.redirect('/app');
    });
    // Redirect any non-API routes to /app (catch-all)
    homeRoute.get(/^(?!.*\/(?:info|data|api)\/).*$/, function (req, res) {
        res.redirect('/app');
    });
    app.use('/', homeRoute);
}
exports.default = addHomeRoutes;
