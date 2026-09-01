import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: "#172033",
          colorInputBackground: "#111827",
          colorInputText: "#f8fafc",
          colorPrimary: "#f59e0b",
          colorText: "#f8fafc",
          colorTextSecondary: "#b7c0d1",
          borderRadius: "0.375rem",
          fontFamily: "system-ui, sans-serif",
        },
        elements: {
          card: "border border-white/10 shadow-none",
          formButtonPrimary: "font-bold",
          footerActionLink: "font-bold",
        },
      }}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
