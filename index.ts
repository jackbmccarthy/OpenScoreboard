
import  fs from "fs"

import { AceBaseServer,  } from 'acebase-server';
import  addEditorRoutes   from "./routes/addEditorRoutes";
import  addAppRoutes   from "./routes/addAppRoutes";
import  addHomeRoutes   from "./routes/addHomeRoutes";
import  addScoreboardRoutes   from "./routes/addScoreboardRoutes";


function startServer(databaseName, databasePath, port=process.env.PORT ? parseInt(process.env.PORT):8080, ) {

  const isLocalDatabase = process.env.USE_LOCAL_DB !== "true" ? false : true
  const dbPath = databasePath
  if(!fs.existsSync(dbPath)){
    fs.mkdirSync(dbPath)
  }

  const server = new AceBaseServer(databaseName,
  {
    path: dbPath,
    host: '0.0.0.0',
    port: port,

    
    transactions: {
      log: false,      // Enable
      maxAge: 30,     // Keep logs of last 30 days
      noWait: false   // Data changes wait for log to be written
    },
    authentication: {
      enabled: false,
      allowUserSignup: false,
      defaultAccessRule: 'auth',
      defaultAdminPassword: 'tabletennis'
    },
    plugins:[ 
      addEditorRoutes, 
      addAppRoutes,  
      addScoreboardRoutes, 
      addHomeRoutes,
    ]
  }
);
return server
}
export default startServer

