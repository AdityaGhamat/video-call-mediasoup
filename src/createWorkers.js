import os from "os";
import mediasoup from "mediasoup";
const cpuLength = os.cpus().length;
import { workerConfig } from "./config/worker.config.js";
export const createWorkers = async () => {
  const workers = [];
  for (let i = 0; i < cpuLength; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: workerConfig.workerSetting.logLevel,
      logTags: workerConfig.workerSetting.logTags,
      rtcMinPort: workerConfig.workerSetting.rtcMinPort,
      rtcMaxPort: workerConfig.workerSetting.rtcMaxPort,
    });

    worker.on("died", () => {
      console.error("Mediasoup worker died, exiting in 2 seconds...");
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }

  return workers;
};
