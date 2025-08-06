/**
 * Chat API Service
 *
 * Handles communication with the AI chat backend.
 * Features:
 * - Real-time AI responses
 * - Account-aware conversations
 * - Network-specific context
 * - Comprehensive error handling
 */

import { env } from "../../config/env";

interface ChatRequest {
  account_address: string;
  message: string;
  network: string;
}

interface ChatResponse {
  response?: string;
  // Allow for direct string responses from backend
  [key: string]: any;
}

export class ChatApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ChatApiError";
  }
}

export const chatApi = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse | string> {
    // Use localhost for chat API since it's running locally
    const baseUrl =
      request.network === "testnet" || process.env.NODE_ENV === "development"
        ? "http://localhost:8090"
        : env.API_BASE_URL;
    const url = `${baseUrl}/api/v1/chat`;

    console.log("=== CHAT API REQUEST ===");
    console.log("URL:", url);
    console.log("Request body:", request);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any auth headers if needed
        },
        body: JSON.stringify(request),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        // Try to get error details from response
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new ChatApiError(errorMessage, response.status);
      }

      const data = await response.json();
      console.log("Response data:", data);
      console.log("Response data type:", typeof data);

      // Backend returns a simple string, so return it directly
      return data;
    } catch (error) {
      console.error("Chat API error:", error);

      if (error instanceof ChatApiError) {
        throw error;
      }

      // Network or other errors
      throw new ChatApiError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    }
  },
};
