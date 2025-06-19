let socket = null;
let device = null;
let localStream = null;
let producerTransport = null;
let producer = null;
let consumerTransport = null;
let consumer = null;
const initConnect = () => {
  socket = io("https://localhost:3030");
  connectButton.innerHTML = "connecting...";
  connectButton.disabled = true;
  addSocketListerners();
};

const deviceSetup = async () => {
  //   console.log(mediasoupClient);
  try {
    device = new mediasoupClient.Device();
    const routerRtpCapabilities = await socket.emitWithAck("getRtpCap");
    await device.load({ routerRtpCapabilities });
    deviceButton.disabled = true;
    createProdButton.disabled = false;
  } catch (error) {
    if (error.name === "UnsupportedError") {
      console.warn("Browser not supported");
    } else {
      console.error("Device creation error:", error);
    }
  }
};

const createProducer = async () => {
  // console.log("created-producer");
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
  } catch (error) {
    console.log("GUM ERROR -> ", error);
  }
  const data = await socket.emitWithAck("create-producer-transport");
  const { id, iceParameters, iceCandidates, dtlsParameters } = data;
  const deviceTransport = device.createSendTransport({
    id,
    iceCandidates,
    iceParameters,
    dtlsParameters,
  });
  producerTransport = deviceTransport;
  producerTransport.on(
    "connect",
    async ({ dtlsParameters }, callback, errback) => {
      // console.log("Transport connect event has fired");
      const resp = await socket.emitWithAck("connect-transport", {
        dtlsParameters,
      });
      if (resp == "success") {
        callback();
      } else if (resp == "error") {
        errback();
      }
      // console.log(resp);
    }
  );
  producerTransport.on("produce", async (parameters, callback, errback) => {
    // console.log("Transport produce event has been fired");
    const { kind, rtpParameters } = parameters;
    const resp = await socket.emitWithAck("start-produce", {
      kind,
      rtpParameters,
    });
    if (resp == "error") {
      errback();
    } else {
      callback({ id: resp });
    }
    // console.log(resp);
    publishButton.disabled = true;
    createConsButton.disabled = false;
  });

  createProdButton.disabled = true;
  publishButton.disabled = false;
};

const publish = async () => {
  // console.log("publish feed");
  const track = localStream.getVideoTracks()[0];
  producer = await producerTransport.produce({ track });
};

const createConsume = async () => {
  // console.log("created-producer");
  const data = await socket.emitWithAck("create-consumer-transport");
  const { id, iceParameters, iceCandidates, dtlsParameters } = data;
  const deviceTransport = device.createRecvTransport({
    id,
    iceCandidates,
    iceParameters,
    dtlsParameters,
  });
  consumerTransport = deviceTransport;
  consumerTransport.on(
    "connect",
    async ({ dtlsParameters }, callback, errback) => {
      // console.log("Transport connect event has fired");
      const resp = await socket.emitWithAck("connect-consumer-transport", {
        dtlsParameters,
      });
      if (resp == "success") {
        callback();
      } else if (resp == "error") {
        errback();
      }
      // console.log(resp);
    }
  );
  // consumerTransport.on("produce", async (parameters, callback, errback) => {
  //   // console.log("Transport produce event has been fired");
  //   const { kind, rtpParameters } = parameters;
  //   const resp = await socket.emitWithAck("start-produce", {
  //     kind,
  //     rtpParameters,
  //   });
  //   if (resp == "error") {
  //     errback();
  //   } else {
  //     callback({ id: resp });
  //   }
  //   // console.log(resp);
  //   publishButton.disabled = true;
  //   createConsButton.disabled = false;
  // });
  consumeButton.disabled = false;
  createConsButton.disabled = true;
};

function addSocketListerners() {
  socket.on("connect", () => {
    connectButton.innerHTML = "connected";
    deviceButton.disabled = false;
    connectButton.disabled = true;
  });
}

const consume = async () => {
  console.log("clicked");
  const consumerParams = await socket.emitWithAck("consume-media", {
    rtpCapabilities: device.rtpCapabilities,
  });
  if (consumerParams == "noProducer") {
    console.log("There is no producer to consume");
  } else if (consumerParams == "cannotConsume") {
    console.log("rtpcapabilites failed cannot consume");
  } else {
    consumer = await consumerTransport.consume({
      id: consumerParams.id,
      producerId: consumerParams.producerId,
      kind: consumerParams.kind,
      rtpParameters: consumerParams.rtpParameters,
    });
    const { track } = consumer;

    remoteVideo.srcObject = new MediaStream([track]);

    await socket.emitWithAck("unpauseConsumer");
  }
};
