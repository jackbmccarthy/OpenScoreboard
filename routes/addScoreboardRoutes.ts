import express from 'express'
import path from 'path'
function addScoreboardRoutes(app) {
  const scoreboard = express.Router();

  scoreboard.use("/", express.static(path.join(__dirname, '../openscoreboard-scoreboard','dist')));
  scoreboard.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../openscoreboard-scoreboard','dist', "index.html"));
  });
 

  app.use("/scoreboard", scoreboard);
}
export default addScoreboardRoutes;
