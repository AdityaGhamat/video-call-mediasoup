export const createWebRtcTransportBothKinds = async (router) => {
  const transport = await router.createWebRtcTransport({
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
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
  return { transport, clientTransportParams };
};
