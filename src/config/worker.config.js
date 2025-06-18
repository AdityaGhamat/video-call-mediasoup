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
  routerMediaCodec: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/H264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1,
      },
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {},
    },
  ],
};
