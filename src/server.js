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
  router = await workers[0].createRouter({
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

//writing socket functions
io.on("connect", (socket) => {
  let clientProducerTransport = null;
  let clientProducer = null;
  socket.on("getRtpCap", (ack) => {
    if (!router) {
      console.error("Router not initialized yet");
      return cb(null);
    }
    ack(router.rtpCapabilities);
  });
  socket.on("create-producer-transport", async (ack) => {
    clientProducerTransport = await router.createWebRtcTransport({
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      listenInfos: [
        {
          protocol: "udp",
          ip: "127.0.0.1",
        },
        {
          protocol: "tcp",
          ip: "127.0.0.1",
        },
      ],
    });
    const clientTransportParams = {
      id: clientProducerTransport.id,
      iceParameters: clientProducerTransport.iceParameters,
      iceCandidates: clientProducerTransport.iceCandidates,
      dtlsParameters: clientProducerTransport.dtlsParameters,
    };
    ack(clientTransportParams);
  });
  socket.on("connect-transport", async (dtlsParameters, ack) => {
    try {
      await clientProducerTransport.connect(dtlsParameters);
      ack("success");
    } catch (error) {
      console.log(error);
      ack("error");
    }
  });
  socket.on("start-produce", async ({ kind, rtpParameters }, ack) => {
    try {
      clientProducer = await clientProducerTransport.produce({
        kind,
        rtpParameters,
      });
      ack(clientProducer.id);
    } catch (error) {
      console.log(error);
      ack("error");
    }
  });
});

//lisening to the server
httpsServer.listen(workerConfig.port, () => {
  console.log(
    `Secure server listening on https://localhost:${workerConfig.port}`
  );
});
