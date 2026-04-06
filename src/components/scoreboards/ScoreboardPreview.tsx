import { Box, Text } from '@/components/ui'
import { defaultScoreboard } from '@/scoreboard/templates/defaultscoreboard'

function getPreviewDoc(web) {
  const html = web?.html || defaultScoreboard.html
  const css = web?.css || defaultScoreboard.css

  return `<!DOCTYPE html>
  <html>
    <head>
      <style>
        html, body {
          margin: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%);
        }
        body {
          transform: scale(0.22);
          transform-origin: top left;
          width: 454.55%;
          height: 454.55%;
        }
        ${css}
      </style>
    </head>
    ${html}
  </html>`
}

export default function ScoreboardPreview({
  web,
  className = '',
  emptyLabel = 'Preview unavailable',
}: {
  web?: { html?: string; css?: string; javascript?: string }
  className?: string
  emptyLabel?: string
}) {
  if (!web?.html && !web?.css) {
    return (
      <Box className={`flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 ${className}`}>
        <Text className="text-sm text-slate-500">{emptyLabel}</Text>
      </Box>
    )
  }

  return (
    <Box className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 ${className}`}>
      <iframe
        title="Scoreboard preview"
        srcDoc={getPreviewDoc(web)}
        className="h-full w-full border-0"
        sandbox=""
      />
    </Box>
  )
}
