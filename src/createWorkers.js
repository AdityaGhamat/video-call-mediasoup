import os from "os";
import mediasoup from "mediasoup";
const cpuLength = os.cpus.length;
import { workerConfig } from "./config/worker.config.js";
export const createWorkers = async () => {
  let workers = [];
  for (let i = 0; i <= cpuLength; i++) {
    const worker = mediasoup.createWorker({
      logLevel: workerConfig.workerSetting.logLevel,
      logTags: workerConfig.workerSetting.logTags,
      rtcMinPort: workerConfig.workerSetting.rtcMinPort,
      rtcMaxPort: workerConfig.workerSetting.rtcMaxPort,
    });
    workers.push(worker);
  }
};
