import { useState, useCallback, useRef } from "react";
import { chatApi, ChatApiError } from "../services/api/chatApi";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { env } from "../config/env";

export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  error?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryMessage: (messageId: string) => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Welcome to Yieldera! I'm your AI liquidity manager. I can help you analyze vault performance, optimize your positions, and answer questions about DeFi strategies. How can I assist you today?",
      timestamp: new Date(),
      status: "sent",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { accountId } = useWalletInterface();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Clear any previous errors
      setError(null);

      // Create user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: content.trim(),
        timestamp: new Date(),
        status: "sending",
      };

      // Add user message to chat
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        // Mark user message as sent
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: "sent" } : msg
          )
        );

        // Show typing indicator
        setIsTyping(true);

        // Prepare request data
        const requestData = {
          account_address: accountId || "anonymous", // Use 'anonymous' if not connected
          message: content.trim(),
          network: env.HEDERA_NETWORK,
        };

        console.log("=== CHAT REQUEST DEBUG ===");
        console.log("Account ID:", accountId);
        console.log("Network:", env.HEDERA_NETWORK);
        console.log("Message:", content.trim());

        // Send to API
        const response = await chatApi.sendMessage(requestData);

        // Create AI response message
        // Note: Backend returns a simple string, not an object with .response property
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content:
            typeof response === "string"
              ? response.trim()
              : response?.response ||
                "I received your message, but I'm having trouble generating a response right now. Please try again.",
          timestamp: new Date(),
          status: "sent",
        };

        // Add AI response to chat
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        console.error("Chat error:", err);

        let errorMessage = "Failed to send message. Please try again.";

        if (err instanceof ChatApiError) {
          if (err.status === 400) {
            errorMessage =
              "Invalid message format. Please try rephrasing your question.";
          } else if (err.status === 401) {
            errorMessage =
              "Authentication required. Please connect your wallet.";
          } else if (err.status === 429) {
            errorMessage =
              "Too many requests. Please wait a moment before trying again.";
          } else if (err.status && err.status >= 500) {
            errorMessage = "Server error. Please try again in a moment.";
          } else {
            errorMessage = err.message;
          }
        } else if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't show error
          return;
        }

        setError(errorMessage);

        // Mark user message as error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, status: "error", error: errorMessage }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        setIsTyping(false);
        abortControllerRef.current = null;
      }
    },
    [accountId]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((msg) => msg.id === messageId);
      if (!message || message.type !== "user") return;

      // Remove the error message and retry
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      await sendMessage(message.content);
    },
    [messages, sendMessage]
  );

  const clearMessages = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMessages([
      {
        id: "1",
        type: "ai",
        content: "Chat cleared. How can I help you with your DeFi strategy?",
        timestamp: new Date(),
        status: "sent",
      },
    ]);
    setError(null);
    setIsLoading(false);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    error,
    sendMessage,
    clearMessages,
    retryMessage,
  };
};
