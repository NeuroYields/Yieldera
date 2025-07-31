import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import App from "./pages/App";
import DepositPage from "./pages/Deposit";
import WithdrawPage from "./pages/Withdraw";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import NavBar from "./components/Navbar";
import Footer from "./components/Footer";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/app"
          element={
            <AllWalletsProvider>
              <div
                className="flex flex-col min-h-screen bg-cyber-black bg-cover bg-no-repeat bg-center"
                // style={{ backgroundImage: `url(${colorBackground})` }}
              >
                <header>
                  <NavBar />
                </header>
                <main className="flex-1 p-6">
                  <App />
                </main>
                <Footer />
              </div>
            </AllWalletsProvider>
          }
        />
        <Route
          path="/deposit/:vaultAddress"
          element={
            <AllWalletsProvider>
              <div className="flex flex-col min-h-screen bg-cyber-black bg-cover bg-no-repeat bg-center">
                <header>
                  <NavBar />
                </header>
                <main className="flex-1">
                  <DepositPage />
                </main>
              </div>
            </AllWalletsProvider>
          }
        />
        <Route
          path="/withdraw/:vaultAddress"
          element={
            <AllWalletsProvider>
              <div className="flex flex-col min-h-screen bg-cyber-black bg-cover bg-no-repeat bg-center">
                <header>
                  <NavBar />
                </header>
                <main className="flex-1">
                  <WithdrawPage />
                </main>
              </div>
            </AllWalletsProvider>
          }
        />
      </Routes>
    </Router>
  );
}
