import { CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";

export type TransactionStage =
  | "idle"
  | "approving"
  | "depositing"
  | "withdrawing"
  | "confirming"
  | "success"
  | "error";

interface TransactionStatusProps {
  stage: TransactionStage;
  isLoading: boolean;
  className?: string;
}

export const TransactionStatusIndicator = ({
  stage,
  isLoading,
  className = "",
}: TransactionStatusProps) => {
  if (!isLoading && stage === "idle") {
    return null;
  }

  const getStatusConfig = () => {
    switch (stage) {
      case "approving":
        return {
          icon: Clock,
          text: "Approving tokens...",
          color: "text-yellow-400",
          bgColor: "bg-yellow-400/10",
        };
      case "depositing":
        return {
          icon: Loader,
          text: "Submitting deposit...",
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
        };
      case "withdrawing":
        return {
          icon: Loader,
          text: "Submitting withdrawal...",
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
        };
      case "confirming":
        return {
          icon: Loader,
          text: "Confirming transaction...",
          color: "text-purple-400",
          bgColor: "bg-purple-400/10",
        };
      case "success":
        return {
          icon: CheckCircle,
          text: "Transaction completed!",
          color: "text-green-400",
          bgColor: "bg-green-400/10",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Transaction failed",
          color: "text-red-400",
          bgColor: "bg-red-400/10",
        };
      default:
        return {
          icon: Loader,
          text: "Processing...",
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
        };
    }
  };

  const { icon: Icon, text, color, bgColor } = getStatusConfig();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor} ${className}`}
    >
      {isLoading && stage !== "success" && stage !== "error" ? (
        <div
          className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${color}`}
        />
      ) : (
        <Icon className={`w-4 h-4 ${color}`} />
      )}
      <span className={`text-sm font-medium ${color}`}>{text}</span>
    </div>
  );
};

export default TransactionStatusIndicator;
