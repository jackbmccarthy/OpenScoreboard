import express from 'express'
import path from 'path'

function addScoreboardRoutes(app) {
  const scoreboard = express.Router();

  // Use standalone path in production, dev path otherwise
  const isProd = process.env.NODE_ENV === 'production';
  const scoreboardPath = isProd
    ? path.join(process.cwd(), '.next', 'standalone', 'scoreboard')
    : path.join(__dirname, '..', 'openscoreboard-scoreboard', 'dist');

  scoreboard.use("/", express.static(scoreboardPath));
  scoreboard.get("*", (req, res) => {
    res.sendFile(path.join(scoreboardPath, 'index.html'));
  });

  app.use("/scoreboard", scoreboard);
}

export default addScoreboardRoutes;
