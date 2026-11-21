import React from "react";
import ReactDOM from "react-dom/client";
import { IS_DEMO_MODE, installDemoFetch } from "./lib/demoBackend.js";

installDemoFetch();

if (!IS_DEMO_MODE) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {});
}

import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
