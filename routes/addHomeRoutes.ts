import express from 'express'

function addHomeRoutes(app) {
  const homeRoute = express.Router();

  homeRoute.get("/", (req, res) => {
    res.redirect("/app");
  });
  homeRoute.get(/^(?!.*\/(?:info|data)\/).*$/, (req, res) => {
    res.redirect("/app");
  });
  
  app.use("/", homeRoute);
}
export default addHomeRoutes;
