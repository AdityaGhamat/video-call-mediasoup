import dotenv from "dotenv";
dotenv.config();
export const workerConfig = {
  port: process.env.port,
  workerSetting: {
    logLevel: "warn",
    logTags: ["info", "ice", "dtls", "rtp", "rtcp"],
    rtcMinPort: 40000,
    rtcMaxPort: 41000,
  },
};
