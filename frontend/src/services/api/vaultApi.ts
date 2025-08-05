import axios from "axios";
import { BackendVaultResponse } from "../../types/api";
import { appConfig } from "../../config";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: appConfig.env.API_BASE_URL,
  timeout: appConfig.env.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging (optional - controlled by env var)
api.interceptors.request.use(
  (config) => {
    if (appConfig.env.ENABLE_API_LOGGING) {
      console.log(
        `Making ${config.method?.toUpperCase()} request to ${config.url}`
      );
    }
    return config;
  },
  (error) => {
    if (appConfig.env.ENABLE_API_LOGGING) {
      console.error("Request error:", error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (appConfig.env.ENABLE_API_LOGGING) {
      console.log(`Response from ${response.config.url}:`, response.status);
    }
    return response;
  },
  (error) => {
    if (appConfig.env.ENABLE_API_LOGGING) {
      console.error("API Error:", error);
      if (error.response) {
        // Server responded with error status
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
      } else {
        // Something else happened
        console.error("Error setting up request:", error.message);
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const vaultApi = {
  // Fetch all vaults
  getAllVaults: async (): Promise<BackendVaultResponse[]> => {
    const response = await api.get<BackendVaultResponse[]>("/api/v1/vaults");
    return response.data;
  },

  // Add more API endpoints as they become available
  // getVaultById: async (id: string): Promise<BackendVaultResponse> => {
  //   const response = await api.get<BackendVaultResponse>(`/api/v1/vaults/${id}`);
  //   return response.data;
  // },
};

export default api;
