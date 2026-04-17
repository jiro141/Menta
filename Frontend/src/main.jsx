import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./app/router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid rgba(255,255,255,0.1)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#1e293b",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#1e293b",
          },
        },
      }}
    />
    <RouterProvider router={router} />
  </React.StrictMode>
);