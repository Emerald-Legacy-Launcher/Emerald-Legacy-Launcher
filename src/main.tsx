import React from "react";
import ReactDOM from "react-dom/client";
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
  console.error("ERREUR FATALE : La div avec l'id 'root' est introuvable dans index.html");
}