import os from "os";
import mediasoup from "mediasoup";
const cpuLength = os.cpus.length;
export const createWorkers = async () => {
  let workers = [];
  for (let i = 0; i <= cpuLength; i++) {
    const worker = mediasoup.createWorker({
      logLevel: "warn",
      logTags: ["info", "ice", "dtls", "rtp", "rtcp"],
      rtcMinPort: 10000,
      rtcMaxPort: 59999,
    });
    workers.push(worker);
  }
};
