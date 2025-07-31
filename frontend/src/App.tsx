// import Footer from "./components/Footer";
// import NavBar from "./components/Navbar";
// import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import AppRouter from "./AppRouter";
// import colorBackground from "./assets/colors.png";
import "./App.css";
import { ToastProvider } from "./components/ui/ToastProvider";
import "./styles/toast.css";

function App() {
  return (
    <>
      <AppRouter />
      <ToastProvider />
    </>
  );
}

export default App;
