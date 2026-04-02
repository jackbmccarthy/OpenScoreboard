import express from 'express'
import path from 'path'

function addEditorRoutes(app) {
  const editor = express.Router();

  // Use standalone path in production, dev path otherwise
  const isProd = process.env.NODE_ENV === 'production';
  const editorPath = isProd
    ? path.join(process.cwd(), '.next', 'standalone', 'editor')
    : path.join(__dirname, '..', 'openscoreboard-editor', 'dist');

  editor.use("/", express.static(editorPath));
  editor.get("*", (req, res) => {
    res.sendFile(path.join(editorPath, 'index.html'));
  });

  app.use("/editor", editor);
}

export default addEditorRoutes;
