//const startServer = require(".");
import startServer from './index'
import dotenv from '@dotenvx/dotenvx'

const allowedProdEnvFiles = ["./.env.production.local", "./.env.production"]
const allowedDevEnvFiles = ["./.env.development","./.env.development.local", ]
dotenv.config({
    path:process.env.NODE_ENV ==="production"? allowedProdEnvFiles : allowedDevEnvFiles
})
const databaseName = process.env.DATABASE_NAME || "openscoreboard"
const databasePath = process.env.DATABASE_PATH || "./"


const serverInstance = startServer(databaseName, databasePath)

serverInstance.on("ready", ()=>{
    console.log("server ready")
})



export default serverInstance