/**
 * Environment Configuration
 * Integrates with existing Hedera config structure and provides environment-specific settings
 */

import { NetworkName } from "./type";

export const env = {
  // API Configuration
  API_BASE_URL:
    process.env.REACT_APP_API_BASE_URL || "https://yieldera.eaglefi.io",
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || "10000", 10),

  // Environment
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || "development",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Feature Flags
  ENABLE_REACT_QUERY_DEVTOOLS:
    process.env.REACT_APP_ENABLE_REACT_QUERY_DEVTOOLS === "true",
  ENABLE_API_LOGGING: process.env.REACT_APP_ENABLE_API_LOGGING === "true",

  // Hedera Network Configuration (integrates with existing networks.ts)
  HEDERA_NETWORK: (process.env.REACT_APP_HEDERA_NETWORK ||
    "mainnet") as NetworkName,

  // App Configuration
  APP_NAME: process.env.REACT_APP_APP_NAME || "Yieldera",
  VERSION: process.env.REACT_APP_VERSION || "0.1.0",
} as const;

// Type definitions for better TypeScript support
export type Environment = "development" | "staging" | "production";

// Helper functions
export const isDevelopment = () => env.NODE_ENV === "development";
export const isProduction = () => env.NODE_ENV === "production";
export const isTestnet = () => env.HEDERA_NETWORK === "testnet";

// Validation function to ensure required env vars are set
export const validateEnvironment = () => {
  const requiredVars = ["REACT_APP_API_BASE_URL"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set."
    );
  }
};

// Log configuration in development
if (isDevelopment()) {
  console.log("🔧 Environment Configuration:", {
    API_BASE_URL: env.API_BASE_URL,
    ENVIRONMENT: env.ENVIRONMENT,
    HEDERA_NETWORK: env.HEDERA_NETWORK,
    ENABLE_REACT_QUERY_DEVTOOLS: env.ENABLE_REACT_QUERY_DEVTOOLS,
    ENABLE_API_LOGGING: env.ENABLE_API_LOGGING,
  });
}
