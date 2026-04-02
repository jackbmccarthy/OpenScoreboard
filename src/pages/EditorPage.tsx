// Editor Page - Scoreboard editor using GrapesJS
// Loads pre-built editor from public/editor

export default function EditorPage() {
  return (
    <iframe
      src="/editor/index.html"
      title="Scoreboard Editor"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none'
      }}
    />
  )
}
