import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

function addAppRoutes(app) {
  // In development, proxy to Next.js dev server on port 3000
  // In production with standalone, proxy to Next.js standalone on port 3000
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (isDev) {
    // Development: proxy to Next.js dev server
    app.use('/app', createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: { '^/app': '' },
    }))
    app.use('/_next', createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    }))
  } else {
    // Production with standalone: proxy to Next.js standalone server
    app.use('/app', createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: { '^/app': '' },
    }))
    app.use('/_next', createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    }))
  }
  
  // Also proxy root to /app in development
  if (isDev) {
    app.get('/', (req, res) => {
      res.redirect('/app')
    })
  }
}
export default addAppRoutes
