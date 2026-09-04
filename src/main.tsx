import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import { App } from "./App";
import { initAnalytics } from "./lib/analytics";

registerSW({ immediate: true });

// Initialise GA4 once — no-op if VITE_GA_MEASUREMENT_ID is unset.
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
