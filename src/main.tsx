import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/App";
import "./css/index.css";
import "./css/App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);