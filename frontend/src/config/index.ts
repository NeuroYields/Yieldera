import { networkConfig } from "./networks";
import { AppConfig } from "./type";
import * as constants from "./constants";
import { env } from "./env";

export * from "./type";
export * from "./env";

export const appConfig: AppConfig & {
  constants: typeof constants;
  env: typeof env;
} = {
  networks: networkConfig,
  constants,
  env,
};

// Helper to get current network config based on environment
export const getCurrentNetworkConfig = () => {
  return networkConfig[env.HEDERA_NETWORK];
};
