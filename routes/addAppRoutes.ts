import path from 'path'
import express from 'express'

function addAppRoutes(app) {
  const appRoute = express.Router();
  console.log(path.join( __dirname, "../openscoreboard-app","dist"))
  appRoute.use( express.static(path.join( __dirname, "../openscoreboard-app","dist")));
  appRoute.get("*", (req, res) => {
    console.log(req.path)
    res.sendFile(path.join(__dirname + '/../openscoreboard-app',"dist", 'index.html'));
  });
  app.use("/app", appRoute);
}
export default addAppRoutes;
