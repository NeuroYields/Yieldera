import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global error handlers to catch unhandled errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  // Prevent the default browser error handling
  return true;
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent the default browser error handling
  event.preventDefault();
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
