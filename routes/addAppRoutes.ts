import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

function addAppRoutes(app) {
  const nextPort = process.env.NEXTJS_PORT || '3000';

  // Proxy /app to Next.js
  app.use('/app', createProxyMiddleware({
    target: `http://localhost:${nextPort}`,
    changeOrigin: true,
    pathRewrite: { '^/app': '' },
  }));

  // Proxy /_next in development (Next.js standalone serves its own static files in prod)
  if (process.env.NODE_ENV !== 'production') {
    app.use('/_next', createProxyMiddleware({
      target: `http://localhost:${nextPort}`,
      changeOrigin: true,
    }));
  }
}

export default addAppRoutes;
