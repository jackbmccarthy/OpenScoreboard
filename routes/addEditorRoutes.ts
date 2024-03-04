import express from 'express'
import path from 'path'
function addEditorRoutes(app) {
  const editor = express.Router();

  editor.use("/", express.static(path.join(__dirname, "../openscoreboard-editor", "dist")));
  editor.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../openscoreboard-editor',"dist", 'index.html'));
  });
 

  app.use("/editor", editor);
}
export default addEditorRoutes;
