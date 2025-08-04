// import Footer from "./components/Footer";
// import NavBar from "./components/Navbar";
// import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import AppRouter from "./AppRouter";
// import colorBackground from "./assets/colors.png";
import "./App.css";
import { ToastProvider } from "./components/ui/ToastProvider";
import "./styles/toast.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { QueryProvider } from "./providers/QueryProvider";
import { validateEnvironment } from "./config/env";

// Validate environment variables on app initialization
try {
  validateEnvironment();
} catch (error) {
  console.error("Environment validation failed:", error);
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AppRouter />
        <ToastProvider />
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
