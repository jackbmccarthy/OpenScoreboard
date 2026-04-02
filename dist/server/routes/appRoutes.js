"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_proxy_middleware_1 = require("http-proxy-middleware");
function addAppRoutes(app) {
    // Next.js standalone port - can be overridden via NEXTJS_PORT env var
    var nextPort = process.env.NEXTJS_PORT || '3000';
    // Proxy /app to Next.js
    app.use('/app', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: "http://localhost:".concat(nextPort),
        changeOrigin: true,
        pathRewrite: { '^/app': '' },
    }));
    // Proxy /_next (Next.js static assets) in development
    // In production, Next.js standalone serves these itself
    if (process.env.NODE_ENV !== 'production') {
        app.use('/_next', (0, http_proxy_middleware_1.createProxyMiddleware)({
            target: "http://localhost:".concat(nextPort),
            changeOrigin: true,
        }));
    }
}
exports.default = addAppRoutes;
