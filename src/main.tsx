import React from "react";
import ReactDOM from "react-dom/client";
import "tauri-plugin-gamepad-api";
import App from "./pages/App";
import "./css/index.css";
import "./css/App.css";
import { LauncherProvider } from "./context/LauncherContext";
// RpcService is now managed by LauncherProvider context
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LauncherProvider>
      <App />
    </LauncherProvider>
  </React.StrictMode>
);