import * as React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { registerAllRecipes } from "./app/arc-engine";
import { router } from "./router";
import "./styles.css";

// ═══ Initialize ARC Engine ═══
// Register all 56+ node recipes before any component renders.
registerAllRecipes();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
