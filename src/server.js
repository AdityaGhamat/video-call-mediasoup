import fs from "fs"; // we need to read it to keys
import https from "https"; // we need it for secures express server
import express from "express";
import { Server } from "socket.io";
import mediasoup from "mediasoup";
import { createWorkers } from "./createWorkers.js";
import { workerConfig } from "./config/worker.config.js";

const app = express();
app.use(express.static("public"));
const key = fs.readFileSync("./src/keys/cert.key");
const cert = fs.readFileSync("./src/keys/cert.crt");
const options = { key, cert };
const httpsServer = https.createServer(options, app);
let workers = null;
let router = null;
const initiateWorkers = async () => {
  workers = await createWorkers();
  console.log("Mediasoup workers created.");
  router = workers[0].createRouter({
    mediaCodecs: workerConfig.routerMediaCodec,
  });
};
initiateWorkers();
//socketio
const io = new Server(httpsServer, {
  cors: {
    origin: [`https://localhost:${workerConfig.port}`],
  },
});

//lisening to the server
httpsServer.listen(workerConfig.port, () => {
  console.log(
    `Secure server listening on https://localhost:${workerConfig.port}`
  );
});
