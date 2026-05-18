import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.paperworks.app",
  appName: "Paperworks",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
