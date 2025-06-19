import fs from "fs"; // we need to read it to keys
import https from "https"; // we need it for secures express server
import express from "express";
import { Server } from "socket.io";
import mediasoup from "mediasoup";
import { createWorkers } from "./createWorkers.js";
import { workerConfig } from "./config/worker.config.js";
import { createWebRtcTransportBothKinds } from "./createWebRtcTransportBothKinds.js";

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
  let clientConsumerTransport = null;
  let clientConsumer = null;
  socket.on("getRtpCap", (ack) => {
    if (!router) {
      console.error("Router not initialized yet");
      return cb(null);
    }
    ack(router.rtpCapabilities);
  });
  socket.on("create-producer-transport", async (ack) => {
    const { transport, clientTransportParams } =
      await createWebRtcTransportBothKinds(router);
    clientProducerTransport = transport;
    ack(clientTransportParams);
  });
  socket.on("create-consumer-transport", async (ack) => {
    const { transport, clientTransportParams } =
      await createWebRtcTransportBothKinds(router);
    clientConsumerTransport = transport;
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
  socket.on("connect-consumer-transport", async (dtlsParameters, ack) => {
    try {
      await clientConsumerTransport.connect(dtlsParameters);
      ack("success");
    } catch (error) {
      console.log(error);
      ack("error");
    }
  });
  socket.on("consume-media", async ({ rtpCapabilities }, ack) => {
    if (!clientProducer) {
      ack("noProducer");
    } else if (
      !router.canConsume({ producerId: clientProducer.id, rtpCapabilities })
    ) {
      ack("cannotConsume");
    } else {
      clientConsumer = await clientConsumerTransport.consume({
        producerId: clientProducer.id,
        rtpCapabilities,
        paused: true,
      });

      const consumerParams = {
        producerId: clientProducer.id,
        id: clientConsumer.id,
        kind: clientConsumer.kind,
        rtpParameters: clientConsumer.rtpParameters,
      };

      ack(consumerParams);
    }
    socket.on("unpauseConsumer", async (ack) => {
      await clientConsumer.resume();
    });
  });
});

//lisening to the server
httpsServer.listen(workerConfig.port, () => {
  console.log(
    `Secure server listening on https://localhost:${workerConfig.port}`
  );
});
