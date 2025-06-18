import fs from "fs"; // we need to read it to keys
import https from "https"; // we need it for secures express server
import express from "express";
import { Server } from "socket.io";
import mediasoup from "mediasoup";
import { createWorkers } from "./createWorkers.js";

const app = express();
app.use(express.static("public"));
const key = fs.readFileSync("./src/keys/cert.key");
const cert = fs.readFileSync("./src/keys/cert.crt");
const options = { key, cert };
const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer, {
  cors: {
    origin: ["https://localhost:3030"],
  },
});
httpsServer.listen(3030);
