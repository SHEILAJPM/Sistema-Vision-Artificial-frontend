import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { SystemProvider } from "./context/SystemProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SystemProvider>
        <App />
      </SystemProvider>
    </BrowserRouter>
  </React.StrictMode>
);
