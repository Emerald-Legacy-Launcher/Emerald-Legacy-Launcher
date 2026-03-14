import React from "react";
import ReactDOM from "react-dom/client";
import 'tauri-plugin-gamepad-api';
import App from "./App";
import './index.css';

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Fatal Error: no `root` element found in index.html!");
}