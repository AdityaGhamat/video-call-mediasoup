export const workerConfig = {
  port: 3030,
  workerSetting: {
    logLevel: "warn",
    logTags: ["info", "ice", "dtls", "rtp", "rtcp"],
    rtcMinPort: 40000,
    rtcMaxPort: 41000,
  },
};
