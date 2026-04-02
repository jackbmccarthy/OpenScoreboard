"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
var acebase_server_1 = require("acebase-server");
var fs_1 = require("fs");
var editorRoutes_1 = require("./routes/editorRoutes");
var scoreboardRoutes_1 = require("./routes/scoreboardRoutes");
var appRoutes_1 = require("./routes/appRoutes");
var homeRoutes_1 = require("./routes/homeRoutes");
function createServer(options) {
    if (options === void 0) { options = {}; }
    var _a = options.databaseName, databaseName = _a === void 0 ? process.env.DATABASE_NAME || 'openscoreboard' : _a, _b = options.databasePath, databasePath = _b === void 0 ? process.env.DATABASE_PATH || './data' : _b, _c = options.port, port = _c === void 0 ? process.env.PORT ? parseInt(process.env.PORT) : 8080 : _c;
    // Ensure database directory exists
    if (!fs_1.default.existsSync(databasePath)) {
        fs_1.default.mkdirSync(databasePath, { recursive: true });
    }
    // AceBase server with our routes as plugins
    var server = new acebase_server_1.AceBaseServer(databaseName, {
        path: databasePath,
        host: '0.0.0.0',
        port: port,
        transactions: {
            log: false,
            maxAge: 30,
            noWait: false,
        },
        authentication: {
            enabled: false,
            allowUserSignup: false,
            defaultAccessRule: 'auth',
            defaultAdminPassword: 'tabletennis',
        },
        plugins: [
            editorRoutes_1.default,
            scoreboardRoutes_1.default,
            appRoutes_1.default,
            homeRoutes_1.default,
        ],
    });
    return server;
}
exports.default = createServer;
